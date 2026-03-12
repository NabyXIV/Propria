from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'propria-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create the main app
app = FastAPI(title="Propria API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class BuildingBase(BaseModel):
    name: str
    address: str

class BuildingCreate(BuildingBase):
    pass

class Building(BuildingBase):
    model_config = ConfigDict(extra="ignore")
    building_id: str
    created_at: datetime
    unit_count: int = 0
    vacant_count: int = 0

class UnitBase(BaseModel):
    name: str
    floor: Optional[int] = None
    rooms: Optional[int] = None

class UnitCreate(UnitBase):
    building_id: str

class Unit(UnitBase):
    model_config = ConfigDict(extra="ignore")
    unit_id: str
    building_id: str
    status: str = "vacant"
    rent: Optional[float] = None
    tenant_name: Optional[str] = None
    created_at: datetime

class TenantBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    model_config = ConfigDict(extra="ignore")
    tenant_id: str
    created_at: datetime
    unit_name: Optional[str] = None
    building_name: Optional[str] = None
    rent: Optional[float] = None
    lease_start: Optional[datetime] = None

class LeaseBase(BaseModel):
    tenant_id: str
    unit_id: str
    start_date: datetime
    rent: float
    due_day: int = 5

class LeaseCreate(LeaseBase):
    pass

class Lease(LeaseBase):
    model_config = ConfigDict(extra="ignore")
    lease_id: str
    contract_file_path: Optional[str] = None
    active: bool = True
    created_at: datetime
    tenant_name: Optional[str] = None
    unit_name: Optional[str] = None
    building_name: Optional[str] = None

class PaymentBase(BaseModel):
    lease_id: str
    period: str  # YYYY-MM
    amount: float
    status: str = "UNPAID"  # PAID, LATE, VERIFY, UNPAID
    due_date: datetime

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None

class Payment(PaymentBase):
    model_config = ConfigDict(extra="ignore")
    payment_id: str
    paid_at: Optional[datetime] = None
    created_at: datetime
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    unit_name: Optional[str] = None
    building_name: Optional[str] = None
    rent: Optional[float] = None

class DocumentBase(BaseModel):
    tenant_id: str
    name: str
    doc_type: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    model_config = ConfigDict(extra="ignore")
    document_id: str
    file_path: str
    created_at: datetime

class ReminderBase(BaseModel):
    tenant_id: str
    payment_id: str
    template_type: str = "sms"
    channel: str = "sms"

class ReminderCreate(ReminderBase):
    pass

class Reminder(ReminderBase):
    model_config = ConfigDict(extra="ignore")
    reminder_id: str
    sent_at: datetime
    message: Optional[str] = None

class DashboardStats(BaseModel):
    expected_amount: float
    paid_amount: float
    late_amount: float
    paid_units: int
    late_units: int
    total_buildings: int
    total_units: int
    total_tenants: int
    occupancy_rate: float

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Validate session token from Emergent OAuth
        session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session_doc:
            expires_at = session_doc.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
                if user_doc:
                    if isinstance(user_doc.get('created_at'), str):
                        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
                    return User(**user_doc)
    
    # Check Authorization header (JWT)
    if credentials:
        token = credentials.credentials
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("user_id")
            user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user_doc:
                if isinstance(user_doc.get('created_at'), str):
                    user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
                return User(**user_doc)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    raise HTTPException(status_code=401, detail="Not authenticated")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login")
    
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["user_id"], user_doc["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_doc["user_id"],
            email=user_doc["email"],
            name=user_doc["name"],
            picture=user_doc.get("picture")
        )
    )

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(user_id=user_id, email=user_data.email, name=user_data.name)
    )

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        data = auth_response.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if user_doc:
        # Update existing user
        await db.users.update_one(
            {"email": data["email"]},
            {"$set": {"name": data["name"], "picture": data.get("picture")}}
        )
        user_id = user_doc["user_id"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": data["email"],
        "name": data["name"],
        "picture": data.get("picture")
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        name=current_user.name,
        picture=current_user.picture
    )

@api_router.post("/auth/logout")
async def logout(response: Response, request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ============== BUILDINGS ROUTES ==============

@api_router.get("/buildings", response_model=List[Building])
async def get_buildings(current_user: User = Depends(get_current_user)):
    buildings = await db.buildings.find({}, {"_id": 0}).to_list(1000)
    result = []
    for b in buildings:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
        # Count units
        units = await db.units.find({"building_id": b["building_id"]}, {"_id": 0}).to_list(100)
        b["unit_count"] = len(units)
        b["vacant_count"] = sum(1 for u in units if u.get("status") == "vacant")
        result.append(Building(**b))
    return result

@api_router.get("/buildings/{building_id}", response_model=Building)
async def get_building(building_id: str, current_user: User = Depends(get_current_user)):
    b = await db.buildings.find_one({"building_id": building_id}, {"_id": 0})
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    if isinstance(b.get('created_at'), str):
        b['created_at'] = datetime.fromisoformat(b['created_at'])
    units = await db.units.find({"building_id": building_id}, {"_id": 0}).to_list(100)
    b["unit_count"] = len(units)
    b["vacant_count"] = sum(1 for u in units if u.get("status") == "vacant")
    return Building(**b)

@api_router.post("/buildings", response_model=Building)
async def create_building(data: BuildingCreate, current_user: User = Depends(get_current_user)):
    building_id = f"bld_{uuid.uuid4().hex[:8]}"
    doc = {
        "building_id": building_id,
        "name": data.name,
        "address": data.address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.buildings.insert_one(doc)
    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    doc["unit_count"] = 0
    doc["vacant_count"] = 0
    return Building(**doc)

@api_router.put("/buildings/{building_id}", response_model=Building)
async def update_building(building_id: str, data: BuildingCreate, current_user: User = Depends(get_current_user)):
    result = await db.buildings.update_one(
        {"building_id": building_id},
        {"$set": {"name": data.name, "address": data.address}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Building not found")
    return await get_building(building_id, current_user)

@api_router.delete("/buildings/{building_id}")
async def delete_building(building_id: str, current_user: User = Depends(get_current_user)):
    result = await db.buildings.delete_one({"building_id": building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Building not found")
    # Also delete associated units
    await db.units.delete_many({"building_id": building_id})
    return {"message": "Building deleted"}

# ============== UNITS ROUTES ==============

@api_router.get("/units", response_model=List[Unit])
async def get_units(building_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"building_id": building_id} if building_id else {}
    units = await db.units.find(query, {"_id": 0}).to_list(1000)
    result = []
    for u in units:
        if isinstance(u.get('created_at'), str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
        # Check if unit has active lease
        lease = await db.leases.find_one({"unit_id": u["unit_id"], "active": True}, {"_id": 0})
        if lease:
            u["status"] = "occupied"
            u["rent"] = lease.get("rent")
            tenant = await db.tenants.find_one({"tenant_id": lease["tenant_id"]}, {"_id": 0})
            if tenant:
                u["tenant_name"] = tenant["full_name"]
        else:
            u["status"] = "vacant"
        result.append(Unit(**u))
    return result

@api_router.get("/units/{unit_id}", response_model=Unit)
async def get_unit(unit_id: str, current_user: User = Depends(get_current_user)):
    u = await db.units.find_one({"unit_id": unit_id}, {"_id": 0})
    if not u:
        raise HTTPException(status_code=404, detail="Unit not found")
    if isinstance(u.get('created_at'), str):
        u['created_at'] = datetime.fromisoformat(u['created_at'])
    lease = await db.leases.find_one({"unit_id": unit_id, "active": True}, {"_id": 0})
    if lease:
        u["status"] = "occupied"
        u["rent"] = lease.get("rent")
        tenant = await db.tenants.find_one({"tenant_id": lease["tenant_id"]}, {"_id": 0})
        if tenant:
            u["tenant_name"] = tenant["full_name"]
    else:
        u["status"] = "vacant"
    return Unit(**u)

@api_router.post("/units", response_model=Unit)
async def create_unit(data: UnitCreate, current_user: User = Depends(get_current_user)):
    # Verify building exists
    building = await db.buildings.find_one({"building_id": data.building_id})
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    unit_id = f"unit_{uuid.uuid4().hex[:8]}"
    doc = {
        "unit_id": unit_id,
        "building_id": data.building_id,
        "name": data.name,
        "floor": data.floor,
        "rooms": data.rooms,
        "status": "vacant",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.units.insert_one(doc)
    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return Unit(**doc)

@api_router.put("/units/{unit_id}", response_model=Unit)
async def update_unit(unit_id: str, data: UnitBase, current_user: User = Depends(get_current_user)):
    result = await db.units.update_one(
        {"unit_id": unit_id},
        {"$set": {"name": data.name, "floor": data.floor, "rooms": data.rooms}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found")
    return await get_unit(unit_id, current_user)

@api_router.delete("/units/{unit_id}")
async def delete_unit(unit_id: str, current_user: User = Depends(get_current_user)):
    result = await db.units.delete_one({"unit_id": unit_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"message": "Unit deleted"}

# ============== TENANTS ROUTES ==============

@api_router.get("/tenants", response_model=List[Tenant])
async def get_tenants(current_user: User = Depends(get_current_user)):
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    result = []
    for t in tenants:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        # Get active lease info
        lease = await db.leases.find_one({"tenant_id": t["tenant_id"], "active": True}, {"_id": 0})
        if lease:
            t["rent"] = lease.get("rent")
            if isinstance(lease.get('start_date'), str):
                t["lease_start"] = datetime.fromisoformat(lease['start_date'])
            else:
                t["lease_start"] = lease.get('start_date')
            unit = await db.units.find_one({"unit_id": lease["unit_id"]}, {"_id": 0})
            if unit:
                t["unit_name"] = unit["name"]
                building = await db.buildings.find_one({"building_id": unit["building_id"]}, {"_id": 0})
                if building:
                    t["building_name"] = building["name"]
        result.append(Tenant(**t))
    return result

@api_router.get("/tenants/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str, current_user: User = Depends(get_current_user)):
    t = await db.tenants.find_one({"tenant_id": tenant_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if isinstance(t.get('created_at'), str):
        t['created_at'] = datetime.fromisoformat(t['created_at'])
    lease = await db.leases.find_one({"tenant_id": tenant_id, "active": True}, {"_id": 0})
    if lease:
        t["rent"] = lease.get("rent")
        if isinstance(lease.get('start_date'), str):
            t["lease_start"] = datetime.fromisoformat(lease['start_date'])
        else:
            t["lease_start"] = lease.get('start_date')
        unit = await db.units.find_one({"unit_id": lease["unit_id"]}, {"_id": 0})
        if unit:
            t["unit_name"] = unit["name"]
            building = await db.buildings.find_one({"building_id": unit["building_id"]}, {"_id": 0})
            if building:
                t["building_name"] = building["name"]
    return Tenant(**t)

@api_router.post("/tenants", response_model=Tenant)
async def create_tenant(data: TenantCreate, current_user: User = Depends(get_current_user)):
    tenant_id = f"ten_{uuid.uuid4().hex[:8]}"
    doc = {
        "tenant_id": tenant_id,
        "full_name": data.full_name,
        "phone": data.phone,
        "email": data.email,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenants.insert_one(doc)
    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return Tenant(**doc)

@api_router.put("/tenants/{tenant_id}", response_model=Tenant)
async def update_tenant(tenant_id: str, data: TenantCreate, current_user: User = Depends(get_current_user)):
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"full_name": data.full_name, "phone": data.phone, "email": data.email}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return await get_tenant(tenant_id, current_user)

@api_router.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str, current_user: User = Depends(get_current_user)):
    result = await db.tenants.delete_one({"tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"message": "Tenant deleted"}

# ============== LEASES ROUTES ==============

@api_router.get("/leases", response_model=List[Lease])
async def get_leases(tenant_id: Optional[str] = None, unit_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if unit_id:
        query["unit_id"] = unit_id
    
    leases = await db.leases.find(query, {"_id": 0}).to_list(1000)
    result = []
    for l in leases:
        if isinstance(l.get('created_at'), str):
            l['created_at'] = datetime.fromisoformat(l['created_at'])
        if isinstance(l.get('start_date'), str):
            l['start_date'] = datetime.fromisoformat(l['start_date'])
        
        # Get tenant and unit info
        tenant = await db.tenants.find_one({"tenant_id": l["tenant_id"]}, {"_id": 0})
        if tenant:
            l["tenant_name"] = tenant["full_name"]
        unit = await db.units.find_one({"unit_id": l["unit_id"]}, {"_id": 0})
        if unit:
            l["unit_name"] = unit["name"]
            building = await db.buildings.find_one({"building_id": unit["building_id"]}, {"_id": 0})
            if building:
                l["building_name"] = building["name"]
        result.append(Lease(**l))
    return result

@api_router.get("/leases/{lease_id}", response_model=Lease)
async def get_lease(lease_id: str, current_user: User = Depends(get_current_user)):
    l = await db.leases.find_one({"lease_id": lease_id}, {"_id": 0})
    if not l:
        raise HTTPException(status_code=404, detail="Lease not found")
    if isinstance(l.get('created_at'), str):
        l['created_at'] = datetime.fromisoformat(l['created_at'])
    if isinstance(l.get('start_date'), str):
        l['start_date'] = datetime.fromisoformat(l['start_date'])
    
    tenant = await db.tenants.find_one({"tenant_id": l["tenant_id"]}, {"_id": 0})
    if tenant:
        l["tenant_name"] = tenant["full_name"]
    unit = await db.units.find_one({"unit_id": l["unit_id"]}, {"_id": 0})
    if unit:
        l["unit_name"] = unit["name"]
        building = await db.buildings.find_one({"building_id": unit["building_id"]}, {"_id": 0})
        if building:
            l["building_name"] = building["name"]
    return Lease(**l)

@api_router.post("/leases", response_model=Lease)
async def create_lease(data: LeaseCreate, current_user: User = Depends(get_current_user)):
    # Verify tenant and unit exist
    tenant = await db.tenants.find_one({"tenant_id": data.tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    unit = await db.units.find_one({"unit_id": data.unit_id})
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Deactivate any existing lease for this unit
    await db.leases.update_many({"unit_id": data.unit_id, "active": True}, {"$set": {"active": False}})
    
    lease_id = f"lease_{uuid.uuid4().hex[:8]}"
    doc = {
        "lease_id": lease_id,
        "tenant_id": data.tenant_id,
        "unit_id": data.unit_id,
        "start_date": data.start_date.isoformat(),
        "rent": data.rent,
        "due_day": data.due_day,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leases.insert_one(doc)
    return await get_lease(lease_id, current_user)

@api_router.put("/leases/{lease_id}", response_model=Lease)
async def update_lease(lease_id: str, data: LeaseCreate, current_user: User = Depends(get_current_user)):
    result = await db.leases.update_one(
        {"lease_id": lease_id},
        {"$set": {
            "tenant_id": data.tenant_id,
            "unit_id": data.unit_id,
            "start_date": data.start_date.isoformat(),
            "rent": data.rent,
            "due_day": data.due_day
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lease not found")
    return await get_lease(lease_id, current_user)

@api_router.delete("/leases/{lease_id}")
async def delete_lease(lease_id: str, current_user: User = Depends(get_current_user)):
    result = await db.leases.delete_one({"lease_id": lease_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lease not found")
    return {"message": "Lease deleted"}

@api_router.post("/leases/{lease_id}/contract")
async def upload_contract(lease_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    lease = await db.leases.find_one({"lease_id": lease_id})
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    # Save file
    file_ext = Path(file.filename).suffix
    file_path = f"contracts/{lease_id}{file_ext}"
    full_path = UPLOAD_DIR / file_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    await db.leases.update_one({"lease_id": lease_id}, {"$set": {"contract_file_path": file_path}})
    return {"message": "Contract uploaded", "file_path": file_path}

# ============== PAYMENTS ROUTES ==============

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(status: Optional[str] = None, period: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    if period:
        query["period"] = period
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    result = []
    for p in payments:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        if isinstance(p.get('due_date'), str):
            p['due_date'] = datetime.fromisoformat(p['due_date'])
        if p.get('paid_at') and isinstance(p['paid_at'], str):
            p['paid_at'] = datetime.fromisoformat(p['paid_at'])
        
        # Get lease info
        lease = await db.leases.find_one({"lease_id": p["lease_id"]}, {"_id": 0})
        if lease:
            p["rent"] = lease.get("rent")
            tenant = await db.tenants.find_one({"tenant_id": lease["tenant_id"]}, {"_id": 0})
            if tenant:
                p["tenant_name"] = tenant["full_name"]
                p["tenant_phone"] = tenant.get("phone")
            unit = await db.units.find_one({"unit_id": lease["unit_id"]}, {"_id": 0})
            if unit:
                p["unit_name"] = unit["name"]
                building = await db.buildings.find_one({"building_id": unit["building_id"]}, {"_id": 0})
                if building:
                    p["building_name"] = building["name"]
        result.append(Payment(**p))
    return result

@api_router.get("/payments/{payment_id}", response_model=Payment)
async def get_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    p = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    if isinstance(p.get('created_at'), str):
        p['created_at'] = datetime.fromisoformat(p['created_at'])
    if isinstance(p.get('due_date'), str):
        p['due_date'] = datetime.fromisoformat(p['due_date'])
    if p.get('paid_at') and isinstance(p['paid_at'], str):
        p['paid_at'] = datetime.fromisoformat(p['paid_at'])
    
    lease = await db.leases.find_one({"lease_id": p["lease_id"]}, {"_id": 0})
    if lease:
        p["rent"] = lease.get("rent")
        tenant = await db.tenants.find_one({"tenant_id": lease["tenant_id"]}, {"_id": 0})
        if tenant:
            p["tenant_name"] = tenant["full_name"]
            p["tenant_phone"] = tenant.get("phone")
        unit = await db.units.find_one({"unit_id": lease["unit_id"]}, {"_id": 0})
        if unit:
            p["unit_name"] = unit["name"]
            building = await db.buildings.find_one({"building_id": unit["building_id"]}, {"_id": 0})
            if building:
                p["building_name"] = building["name"]
    return Payment(**p)

@api_router.post("/payments", response_model=Payment)
async def create_payment(data: PaymentCreate, current_user: User = Depends(get_current_user)):
    lease = await db.leases.find_one({"lease_id": data.lease_id})
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    payment_id = f"pay_{uuid.uuid4().hex[:8]}"
    doc = {
        "payment_id": payment_id,
        "lease_id": data.lease_id,
        "period": data.period,
        "amount": data.amount,
        "status": data.status,
        "due_date": data.due_date.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(doc)
    return await get_payment(payment_id, current_user)

@api_router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(payment_id: str, data: PaymentUpdate, current_user: User = Depends(get_current_user)):
    update_data = {}
    if data.status:
        update_data["status"] = data.status
    if data.paid_at:
        update_data["paid_at"] = data.paid_at.isoformat()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.payments.update_one({"payment_id": payment_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return await get_payment(payment_id, current_user)

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    result = await db.payments.delete_one({"payment_id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted"}

# ============== DOCUMENTS ROUTES ==============

@api_router.get("/documents", response_model=List[Document])
async def get_documents(tenant_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"tenant_id": tenant_id} if tenant_id else {}
    documents = await db.documents.find(query, {"_id": 0}).to_list(1000)
    result = []
    for d in documents:
        if isinstance(d.get('created_at'), str):
            d['created_at'] = datetime.fromisoformat(d['created_at'])
        result.append(Document(**d))
    return result

@api_router.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str, current_user: User = Depends(get_current_user)):
    d = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    if isinstance(d.get('created_at'), str):
        d['created_at'] = datetime.fromisoformat(d['created_at'])
    return Document(**d)

@api_router.post("/tenants/{tenant_id}/documents")
async def upload_document(
    tenant_id: str,
    file: UploadFile = File(...),
    name: str = Form(...),
    doc_type: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Save file
    document_id = f"doc_{uuid.uuid4().hex[:8]}"
    file_ext = Path(file.filename).suffix
    file_path = f"documents/{tenant_id}/{document_id}{file_ext}"
    full_path = UPLOAD_DIR / file_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    doc = {
        "document_id": document_id,
        "tenant_id": tenant_id,
        "name": name,
        "doc_type": doc_type,
        "file_path": file_path,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc)
    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return Document(**doc)

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    file_path = UPLOAD_DIR / doc["file_path"]
    if file_path.exists():
        file_path.unlink()
    
    await db.documents.delete_one({"document_id": document_id})
    return {"message": "Document deleted"}

# ============== REMINDERS ROUTES ==============

@api_router.get("/reminders", response_model=List[Reminder])
async def get_reminders(current_user: User = Depends(get_current_user)):
    reminders = await db.reminders.find({}, {"_id": 0}).to_list(1000)
    result = []
    for r in reminders:
        if isinstance(r.get('sent_at'), str):
            r['sent_at'] = datetime.fromisoformat(r['sent_at'])
        result.append(Reminder(**r))
    return result

@api_router.post("/reminders", response_model=Reminder)
async def create_reminder(data: ReminderCreate, current_user: User = Depends(get_current_user)):
    # Get payment and tenant info for message
    payment = await db.payments.find_one({"payment_id": data.payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    tenant = await db.tenants.find_one({"tenant_id": data.tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Generate reminder message
    message = f"""Bonjour {tenant['full_name']},

Nous vous rappelons que votre loyer de {payment['amount']}$ pour la période {payment['period']} est en retard.
Date d'échéance: {payment['due_date'][:10]}

Merci de régulariser votre situation dans les plus brefs délais.

Cordialement,
DORA - Gestion Locative"""
    
    reminder_id = f"rem_{uuid.uuid4().hex[:8]}"
    doc = {
        "reminder_id": reminder_id,
        "tenant_id": data.tenant_id,
        "payment_id": data.payment_id,
        "template_type": data.template_type,
        "channel": data.channel,
        "message": message,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reminders.insert_one(doc)
    doc["sent_at"] = datetime.fromisoformat(doc["sent_at"])
    return Reminder(**doc)

# ============== FILES ROUTE ==============

@api_router.get("/files/{file_path:path}")
async def get_file(file_path: str, current_user: User = Depends(get_current_user)):
    full_path = UPLOAD_DIR / file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full_path)

# ============== DASHBOARD ROUTE ==============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Current month
    now = datetime.now(timezone.utc)
    current_period = now.strftime("%Y-%m")
    
    # Get all active leases
    active_leases = await db.leases.find({"active": True}, {"_id": 0}).to_list(1000)
    
    # Calculate expected amount
    expected_amount = sum(l.get("rent", 0) for l in active_leases)
    
    # Get current month payments
    payments = await db.payments.find({"period": current_period}, {"_id": 0}).to_list(1000)
    
    paid_amount = sum(p["amount"] for p in payments if p["status"] == "PAID")
    late_amount = sum(p["amount"] for p in payments if p["status"] == "LATE")
    paid_units = len([p for p in payments if p["status"] == "PAID"])
    late_units = len([p for p in payments if p["status"] == "LATE"])
    
    # Get totals
    total_buildings = await db.buildings.count_documents({})
    total_units = await db.units.count_documents({})
    total_tenants = await db.tenants.count_documents({})
    
    # Occupancy rate
    occupied_units = len(active_leases)
    occupancy_rate = (occupied_units / total_units * 100) if total_units > 0 else 0
    
    return DashboardStats(
        expected_amount=expected_amount,
        paid_amount=paid_amount,
        late_amount=late_amount,
        paid_units=paid_units,
        late_units=late_units,
        total_buildings=total_buildings,
        total_units=total_units,
        total_tenants=total_tenants,
        occupancy_rate=round(occupancy_rate, 1)
    )

@api_router.get("/dashboard/recent-payments", response_model=List[Payment])
async def get_recent_payments(limit: int = 5, current_user: User = Depends(get_current_user)):
    payments = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    result = []
    for p in payments:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        if isinstance(p.get('due_date'), str):
            p['due_date'] = datetime.fromisoformat(p['due_date'])
        if p.get('paid_at') and isinstance(p['paid_at'], str):
            p['paid_at'] = datetime.fromisoformat(p['paid_at'])
        
        lease = await db.leases.find_one({"lease_id": p["lease_id"]}, {"_id": 0})
        if lease:
            p["rent"] = lease.get("rent")
            tenant = await db.tenants.find_one({"tenant_id": lease["tenant_id"]}, {"_id": 0})
            if tenant:
                p["tenant_name"] = tenant["full_name"]
                p["tenant_phone"] = tenant.get("phone")
            unit = await db.units.find_one({"unit_id": lease["unit_id"]}, {"_id": 0})
            if unit:
                p["unit_name"] = unit["name"]
                building = await db.buildings.find_one({"building_id": unit["building_id"]}, {"_id": 0})
                if building:
                    p["building_name"] = building["name"]
        result.append(Payment(**p))
    return result

@api_router.get("/dashboard/chart-data")
async def get_chart_data(current_user: User = Depends(get_current_user)):
    # Get last 12 months data
    now = datetime.now(timezone.utc)
    months = []
    for i in range(11, -1, -1):
        date = now - timedelta(days=i*30)
        months.append(date.strftime("%Y-%m"))
    
    chart_data = []
    for month in months:
        payments = await db.payments.find({"period": month}, {"_id": 0}).to_list(1000)
        paid = sum(p["amount"] for p in payments if p["status"] == "PAID")
        expected = sum(p["amount"] for p in payments)
        chart_data.append({
            "month": month,
            "paid": paid,
            "expected": expected
        })
    
    return chart_data

# ============== SEED ROUTE (DEV ONLY) ==============

@api_router.post("/seed")
async def seed_database():
    """Seed the database with test data"""
    
    # Clear existing data
    await db.users.delete_many({})
    await db.buildings.delete_many({})
    await db.units.delete_many({})
    await db.tenants.delete_many({})
    await db.leases.delete_many({})
    await db.payments.delete_many({})
    await db.documents.delete_many({})
    await db.reminders.delete_many({})
    await db.user_sessions.delete_many({})
    
    # Create admin user
    admin_user = {
        "user_id": "user_admin001",
        "email": "admin@example.com",
        "name": "Admin",
        "password_hash": hash_password("AdminPassword123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    # Create buildings
    buildings = [
        {"building_id": "bld_001", "name": "Immeuble A", "address": "Rue 13, Dakar - Corniche Ouest", "created_at": datetime.now(timezone.utc).isoformat()},
        {"building_id": "bld_002", "name": "Immeuble BTP", "address": "Rond Point, Dakar - Centre-ville", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.buildings.insert_many(buildings)
    
    # Create units
    units = [
        {"unit_id": "unit_001", "building_id": "bld_001", "name": "APT-7515", "floor": 1, "rooms": 3, "created_at": datetime.now(timezone.utc).isoformat()},
        {"unit_id": "unit_002", "building_id": "bld_001", "name": "APT-691", "floor": 2, "rooms": 2, "created_at": datetime.now(timezone.utc).isoformat()},
        {"unit_id": "unit_003", "building_id": "bld_001", "name": "APT-759", "floor": 3, "rooms": 4, "created_at": datetime.now(timezone.utc).isoformat()},
        {"unit_id": "unit_004", "building_id": "bld_002", "name": "APT-201", "floor": 1, "rooms": 2, "created_at": datetime.now(timezone.utc).isoformat()},
        {"unit_id": "unit_005", "building_id": "bld_002", "name": "APT-302", "floor": 2, "rooms": 3, "created_at": datetime.now(timezone.utc).isoformat()},
        {"unit_id": "unit_006", "building_id": "bld_002", "name": "APT-403", "floor": 3, "rooms": 2, "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.units.insert_many(units)
    
    # Create tenants
    tenants = [
        {"tenant_id": "ten_001", "full_name": "Lamine THIAM", "phone": "+221 77 000 00 00", "email": "lamine.thiam@email.com", "created_at": datetime.now(timezone.utc).isoformat()},
        {"tenant_id": "ten_002", "full_name": "Cheikh Tidiane", "phone": "+221 77 111 11 11", "email": "cheikh.tidiane@email.com", "created_at": datetime.now(timezone.utc).isoformat()},
        {"tenant_id": "ten_003", "full_name": "Babacar NGOM", "phone": "+221 77 222 22 22", "email": "babacar.ngom@email.com", "created_at": datetime.now(timezone.utc).isoformat()},
        {"tenant_id": "ten_004", "full_name": "Astou DEM", "phone": "+221 77 333 33 33", "email": "astou.dem@email.com", "created_at": datetime.now(timezone.utc).isoformat()},
        {"tenant_id": "ten_005", "full_name": "Samba LO", "phone": "+221 77 444 44 44", "email": "samba.lo@email.com", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.tenants.insert_many(tenants)
    
    # Create leases
    lease_start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    leases = [
        {"lease_id": "lease_001", "tenant_id": "ten_001", "unit_id": "unit_001", "start_date": lease_start.isoformat(), "rent": 400, "due_day": 5, "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"lease_id": "lease_002", "tenant_id": "ten_002", "unit_id": "unit_002", "start_date": lease_start.isoformat(), "rent": 570, "due_day": 5, "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"lease_id": "lease_003", "tenant_id": "ten_003", "unit_id": "unit_004", "start_date": lease_start.isoformat(), "rent": 750, "due_day": 5, "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"lease_id": "lease_004", "tenant_id": "ten_004", "unit_id": "unit_005", "start_date": lease_start.isoformat(), "rent": 600, "due_day": 5, "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"lease_id": "lease_005", "tenant_id": "ten_005", "unit_id": "unit_006", "start_date": lease_start.isoformat(), "rent": 450, "due_day": 5, "active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.leases.insert_many(leases)
    
    # Create payments (15 payments with varied statuses)
    payments = []
    statuses = ["PAID", "PAID", "PAID", "LATE", "LATE", "VERIFY", "UNPAID", "PAID", "PAID", "LATE", "PAID", "VERIFY", "PAID", "UNPAID", "PAID"]
    lease_ids = ["lease_001", "lease_002", "lease_003", "lease_004", "lease_005"]
    amounts = [400, 570, 750, 600, 450]
    
    for i in range(15):
        lease_idx = i % 5
        period = f"2026-{str((i // 5) + 1).zfill(2)}"
        due_date = datetime(2026, (i // 5) + 1, 5, tzinfo=timezone.utc)
        paid_at = due_date + timedelta(days=2) if statuses[i] == "PAID" else None
        
        payment = {
            "payment_id": f"pay_{str(i+1).zfill(3)}",
            "lease_id": lease_ids[lease_idx],
            "period": period,
            "amount": amounts[lease_idx],
            "status": statuses[i],
            "due_date": due_date.isoformat(),
            "paid_at": paid_at.isoformat() if paid_at else None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        payments.append(payment)
    await db.payments.insert_many(payments)
    
    # Create documents
    documents = [
        {"document_id": "doc_001", "tenant_id": "ten_001", "name": "Carte d'identité", "doc_type": "image", "file_path": "documents/ten_001/id.jpg", "created_at": datetime.now(timezone.utc).isoformat()},
        {"document_id": "doc_002", "tenant_id": "ten_001", "name": "Justificatif de revenu", "doc_type": "pdf", "file_path": "documents/ten_001/income.pdf", "created_at": datetime.now(timezone.utc).isoformat()},
        {"document_id": "doc_003", "tenant_id": "ten_002", "name": "Carte d'identité", "doc_type": "image", "file_path": "documents/ten_002/id.jpg", "created_at": datetime.now(timezone.utc).isoformat()},
        {"document_id": "doc_004", "tenant_id": "ten_003", "name": "Attestation employeur", "doc_type": "pdf", "file_path": "documents/ten_003/employer.pdf", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.documents.insert_many(documents)
    
    return {"message": "Database seeded successfully", "data": {
        "users": 1,
        "buildings": 2,
        "units": 6,
        "tenants": 5,
        "leases": 5,
        "payments": 15,
        "documents": 4
    }}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",      # Development frontend
        "http://localhost:8000",      # Backend (swagger docs)
        "http://127.0.0.1:3000",      # Alternative localhost
        "http://127.0.0.1:8000",      # Alternative backend
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
