from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.core.database import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.buildings import router as buildings_router
from app.routes.units import router as units_router
from app.routes.tenants import router as tenants_router
load_dotenv()

app = FastAPI(title="Propria API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

app.include_router(auth_router, prefix="/api")
app.include_router(buildings_router, prefix="/api")
app.include_router(units_router, prefix="/api")
app.include_router(tenants_router, prefix="/api")
@app.get("/")
async def root():
    return {"message": "Propria API fonctionne !"}