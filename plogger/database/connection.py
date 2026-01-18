from sqlmodel import create_engine, Session
from typing import Generator
from config import settings

# Database Configuration
# DATABASE_URL = "postgresql://myuser:mypassword@localhost:5432/log_service"


engine = create_engine( settings.DATABASE_URL , echo=False)

def get_session() -> Generator[Session, None, None]:
    """
    Dependency to be used in FastAPI Controllers.
    Ensures the session is closed even if errors occur.
    """
    with Session(engine) as session:
        yield session