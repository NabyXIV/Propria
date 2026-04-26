from motor.motor_asyncio import AsyncIOMotorClient
import os

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME", "propria")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    print(f"✅ Connecté à MongoDB — base: {db_name}")

async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB déconnecté")

def get_db():
    return db