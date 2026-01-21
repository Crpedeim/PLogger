from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from controllers.auth import get_current_user
from models.models import User
from services.chat_service import get_chat_response
from config import settings

router = APIRouter(prefix="/chat", tags=["AI Chat"])



class ChatRequest(BaseModel):
    
    session_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]


@router.post("/query", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest , current_user: User = Depends(get_current_user)):


    try:
        # Call the service directly
        result = get_chat_response(
            user_id= current_user.id,
            session_id=request.session_id,
            query=request.query,
            google_api_key= settings.GOOGLE_API_KEY
        )

        return {
            "answer": result["answer"],
            "sources": result["sources"]
        }

    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/session/{session_id}", status_code=204)
async def clear_session(session_id: str):
    # Remove from our in-memory store
    # We import session_store from services.chat_service
    from services.chat_service import session_store
    
    if session_id in session_store:
        del session_store[session_id]
        print(f"Cleaned up session: {session_id}")

    return
