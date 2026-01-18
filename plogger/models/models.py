from typing import Any, Dict, Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import JSON, Column, Text
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid

# 1. The Pydantic Model (Validation for incoming Java JSON)
class LogIngestSchema(SQLModel):
    data: str
    severity: str
    timestamp: str 
    threadId: str
    threadName: str
    stackTrace: Optional[str] = None
    project_name: str
    user_Id: str 

# 2. The Database Model: User
class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    logs: List["LogEntry"] = Relationship(back_populates="user")

    username: str = Field(index=True, unique=True)
    password_hash: str  
    # api_key: str = Field(index=True, unique=True)



class LogEntry(SQLModel, table=True):
    __tablename__ = "logs"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Foreign Key
    user_id: str = Field(foreign_key="user.id", index=True)
    user: Optional[User] = Relationship(back_populates="logs")

    raw_data: Dict[str, Any] = Field(sa_column=Column(JSON))

    # --- metadata ---
    message: str = Field(index=True)           
    severity: str = Field(index=True)          
    timestamp: datetime = Field(index=True)    
    
    thread_id: str                            
    thread_name: str                          
    stack_trace: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    project_name: str = Field(index=True)      

    # The Vector Embedding (384 dimensions)
    embedding: List[float] = Field(sa_column=Column(Vector(384)))