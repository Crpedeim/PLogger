from typing import List
from datetime import datetime
from sqlmodel import Session, select
from sentence_transformers import SentenceTransformer
from database.connection import engine

from models.models import LogEntry, User, LogIngestSchema


_embedding_model = None

def get_model():
    global _embedding_model
    if _embedding_model is None:
        print("Loading Embedding Model (all-MiniLM-L6-v2)...")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model

# --- THE WORKER FUNCTION ---
def process_logs_task(log_batch: List[LogIngestSchema]):
    """
    Background task to embed logs and save them to Postgres.
    Includes 'Get-or-Create' logic for Users to satisfy Foreign Keys.
    """
    if not log_batch:
        return

    model = get_model()

    with Session(engine) as session:
        try:
           
            incoming_user_ids = {log.user_Id for log in log_batch}

            
            statement = select(User.id).where(User.id.in_(incoming_user_ids))
            existing_user_ids = set(session.exec(statement).all())

       
            missing_user_ids = incoming_user_ids - existing_user_ids

          
            if missing_user_ids:
                print(f"Creating {len(missing_user_ids)} new users...")
                new_users = [User(id=uid) for uid in missing_user_ids]
                session.add_all(new_users)
                session.commit() 

            # --- STEP 2: LOG INGESTION ---
            new_log_entries = []
            
            for log_data in log_batch:
                
                try:
                    ts = datetime.strptime(log_data.timestamp, "%Y-%m-%d %H:%M:%S")
                except (ValueError, TypeError):
                    ts = datetime.utcnow()

                
                trace_snippet = (log_data.stackTrace or "")[:500]
                text_to_embed = f"[{log_data.severity}] {log_data.project_name}: {log_data.data} {trace_snippet}"

              
                vector = model.encode(text_to_embed).tolist()

                ## Map Pydantic Schema -> Database Model
                log_entry = LogEntry(
                    user_id=log_data.user_Id,
                    message=log_data.data,
                    severity=log_data.severity,
                    timestamp=ts,
                    thread_id=log_data.threadId,
                    thread_name=log_data.threadName,
                    stack_trace=log_data.stackTrace,
                    project_name=log_data.project_name,
                    embedding=vector
                )
                new_log_entries.append(log_entry)

            # --- STEP 3: BULK INSERT LOGS ---
            session.add_all(new_log_entries)
            session.commit()
            
            print(f"Successfully ingested {len(new_log_entries)} logs.")

        except Exception as e:
            print(f"CRITICAL ERROR in ingestion task: {e}")
            session.rollback() # Undo changes if something exploded