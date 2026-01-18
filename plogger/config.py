import os
from dotenv import load_dotenv

# Load variables from .env file into the system
load_dotenv()

class Settings:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    SECRET_KEY = os.getenv("SECRET_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL")

    # validation check
    if not GOOGLE_API_KEY:
        raise ValueError("No GOOGLE_API_KEY found in environment variables")

settings = Settings()