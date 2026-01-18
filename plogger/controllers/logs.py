from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from typing import List

# Import your schema and the background task function
from models.models import LogIngestSchema
from background_workers.ingestion import process_logs_task

# Create a router (mini-app) for log-related endpoints
router = APIRouter(prefix="/logs", tags=["Logs"])

@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_logs(
    logs: List[LogIngestSchema], 
    background_tasks: BackgroundTasks
):
    
    print(logs)
    """
    Receives a batch of logs from the Java SDK.
    - Validates schema (Pydantic).
    - Offloads processing to background worker.
    - Returns immediately to avoid blocking the client.
    """
    if not logs:
        print("no logs")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Log batch cannot be empty"
        )

    # The Magic Line: This schedules the task to run AFTER the response is sent.
    background_tasks.add_task(process_logs_task, logs)

    return {
        "status": "accepted",
        "message": f"Queued {len(logs)} logs for background processing"
    }
