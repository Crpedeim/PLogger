from fastapi import FastAPI
from contextlib import asynccontextmanager
from database.connection import engine
from sqlmodel import SQLModel, Session
from controllers import auth, chat, logs
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
 # Import your new controller

# --- LIFESPAN MANAGER ---
@asynccontextmanager
async def lifespan(app: FastAPI):

    print("--- STARTUP: Checking Database Extensions ---")
    with Session(engine) as session:
        # This raw SQL command turns on the vector feature
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
        session.commit()


  
    # This ensures your Postgres is ready before any request hits
    print("--- STARTUP: Initializing Database Schema ---")
    SQLModel.metadata.create_all(engine)
    
    yield
    
    # 2. Shutdown (Optional cleanup)
    print("--- SHUTDOWN: Cleaning up resources ---")

# --- APP INITIALIZATION ---
app = FastAPI(
    title="Piggest Project Log Service",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",  # React Frontend (Vite default)
    "http://localhost:3000",  # React (CRA default)
    "http://127.0.0.1:5173",  # Alternate localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Who can call this API
    allow_credentials=True,      # Allow cookies/headers
    allow_methods=["*"],         # Allow POST, GET, DELETE, etc.
    allow_headers=["*"],         # Allow "Authorization" header
)

# --- REGISTER CONTROLLERS ---
app.include_router(logs.router)
app.include_router(chat.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "Log Ingestion Service is Running"}