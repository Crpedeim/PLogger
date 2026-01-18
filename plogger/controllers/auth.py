from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from pydantic import BaseModel
from passlib.context import CryptContext
import uuid
from jose import jwt  
from fastapi.security import OAuth2PasswordBearer

from database.connection import get_session
from models.models import User
from config import settings

# Setup Password Hashing

# SECRET_KEY = "a_super_secret_key"
# ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["Authentication"])

class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str

class UserProfile(BaseModel):
    user_id: str
    username: str
    created_at: datetime

# --- SCHEMAS ---
class SignupRequest(BaseModel):
    username: str
    password: str

class SignupResponse(BaseModel):
    user_id: str
    message: str


class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

## helper function
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    """
    Dependency that decodes the JWT and retrieves the User object.
    Use this in your Chat Controller to lock it down.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms= "HS256")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

# --- ENDPOINTS ---
@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, session: Session = Depends(get_session)):
    """
    Registers a new user and returns their user_id.
    This user_id MUST be used in the Java SDK configuration.


    """
    
    # 1. Check if username already exists
    # We query the DB to see if this name is taken
    statement = select(User).where(User.username == request.username)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists. Please choose another."
        )

    # 2. Hash the password
    # NEVER save request.password directly
    hashed_password = pwd_context.hash(request.password)
    
    # 3. Generate a UUID for the user_id (This acts as their API Key for now)
    new_user_id = str(uuid.uuid4())
    
    # 4. Create User
    new_user = User(
        id=new_user_id,
        username=request.username,
        password_hash=hashed_password
    )
    
    try:
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Database error during registration")

    return {
        "user_id": new_user.id,
        "message": "User created successfully. Use this ID in your Java SDK."
    }


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):
    """
    Authenticates a user and returns a JWT Access Token + User ID.
    """
    # 1. Find User by Username
    statement = select(User).where(User.username == request.username)
    user = session.exec(statement).first()
    
    # 2. Check if User exists AND Password is correct
    if not user or not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create JWT Token
    # We embed the user_id (sub) into the token so we can identify them later
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username},
        expires_delta=access_token_expires
    )

    # 4. Return Data
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }


@router.patch("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request: ResetPasswordRequest, session: Session = Depends(get_session)):
    """
    WARNING: simple implementation for development.
    In production, this should require email verification or OTP.
    """
    statement = select(User).where(User.username == request.username)
    user = session.exec(statement).first()
    
    if not user:
        # Security: Don't reveal if user exists or not, but for now we throw 404
        raise HTTPException(status_code=404, detail="User not found")

    # Hash new password
    user.password_hash = pwd_context.hash(request.new_password)
    session.add(user)
    session.commit()
    
    return {"message": "Password updated successfully. You can now login."}


@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the logged-in user's details, including their API Key (user_id).
    """
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "created_at": current_user.created_at
    }
