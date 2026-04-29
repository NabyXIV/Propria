import bcrypt
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.core.database import get_db

def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        password.encode('utf-8'), 
        hashed.encode('utf-8')
    )

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(
            hours=settings.JWT_EXPIRATION_HOURS
        )
    }
    return jwt.encode(
        payload, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )

def decode_jwt_token(token: str) -> dict:
    return jwt.decode(
        token, 
        settings.JWT_SECRET, 
        algorithms=[settings.JWT_ALGORITHM]
    )

async def get_user_by_email(email: str):
    db = get_db()
    return await db.users.find_one({"email": email}, {"_id": 0})

async def get_user_by_id(user_id: str):
    db = get_db()
    return await db.users.find_one({"user_id": user_id}, {"_id": 0})

async def create_user(email: str, password: str, name: str):
    db = get_db()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
    return doc