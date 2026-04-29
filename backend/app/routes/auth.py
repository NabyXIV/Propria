from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.auth import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import (
    get_user_by_email,
    get_user_by_id,
    create_user,
    verify_password,
    create_jwt_token,
    decode_jwt_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        payload = decode_jwt_token(token)
        user_id = payload.get("user_id")
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate):
    # Vérifie si l'email existe déjà
    existing = await get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Crée l'utilisateur
    user = await create_user(data.email, data.password, data.name)
    token = create_jwt_token(user["user_id"], user["email"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"]
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    # Vérifie que l'utilisateur existe
    user = await get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    # Vérifie le mot de passe
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    token = create_jwt_token(user["user_id"], user["email"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        name=current_user["name"]
    )

@router.post("/logout")
async def logout():
    return {"message": "Déconnecté avec succès"}