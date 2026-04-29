import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # MongoDB
    MONGO_URL: str = os.getenv("MONGO_URL")
    DB_NAME: str = os.getenv("DB_NAME", "propria")
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "propria-secret")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # App
    APP_NAME: str = "Propria API"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

settings = Settings()