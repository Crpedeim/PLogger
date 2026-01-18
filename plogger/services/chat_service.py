from typing import List
from operator import itemgetter
import time
from threading import Thread
# Core LangChain Imports (Stable)
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document

# Integration Imports
from langchain_google_genai import ChatGoogleGenerativeAI
from sentence_transformers import SentenceTransformer
from sqlmodel import Session, select
from models.models import LogEntry
from database.connection import engine

# --- 1. SESSION MEMORY (Simple In-Memory Store) ---
# Format: { "session_id": [HumanMessage(...), AIMessage(...)] }
session_store = {}
SESSION_TTL = 1800

def get_history(session_id: str) -> List:
    # 1. Update Timestamp on access
    if session_id in session_store:
        session_store[session_id]["last_accessed"] = time.time()
        return session_store[session_id]["history"]
    return []

## updates session history
def update_history(session_id: str, query: str, answer: str, docs: List[Document]):
    """
    Updates memory. 
    TRICK: We append the 'Context Logs' to the AI message in history, 
    so the LLM remembers the specific details of what it just read.
    """
    if session_id not in session_store:
        session_store[session_id] = {"history" : [] , "last_accessed" : time.time()}

    
    session_store[session_id]["last_accesssed"] = time.time()
    
    # 1. Save User Query
    history = session_store[session_id]["history"]

    history.append(HumanMessage(content= query))
    
    # 2. Format the logs into a "Memory Block"
    # We limit it to avoid exploding the token window (e.g., keep top 3 logs)
    context_str = "\n".join([f"- {d.page_content}" for d in docs[:5]])
    
    # 3. Create the "Hidden Context" Message
    # The LLM sees this next time. The User only sees 'answer' in the UI.
    memory_content = (
        f"{answer}\n\n"
        f"--- PREVIOUS RETRIEVED CONTEXT (Hidden from user) ---\n"
        f"{context_str}\n"
        f"--- END CONTEXT ---"
    )
    
    history.append(AIMessage(content=memory_content))

# --- 2. SETUP MODELS ---
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if not _embedding_model:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model

# --- 3. CUSTOM RETRIEVER ---
class LogRetriever(BaseRetriever):
    user_id: str
    
    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        model = get_embedding_model()
        query_vector = model.encode(query).tolist()
        
        with Session(engine) as session:
            statement = select(LogEntry).where(
                LogEntry.user_id == self.user_id
            ).order_by(
                LogEntry.embedding.cosine_distance(query_vector)
            ).limit(5)
            results = session.exec(statement).all()
            
            docs = []
            for log in results:
                content = (
                    f"thread : {log.thread_name}"
                    f"Time: {log.timestamp} | Level: {log.severity} | "
                    f"Project: {log.project_name} | Msg: {log.message} | "
                    f"Trace: {log.stack_trace[:300] if log.stack_trace else 'None'} |"
                    f"Severity: {log.severity}"
                )

                metadata = log.model_dump(exclude={"embedding", "raw_data"})
                metadata["timestamp"] = str(log.timestamp)
                docs.append(Document(page_content=content, metadata= metadata))
            return docs

# --- 4. THE CHAIN FACTORY ---
def get_chat_response(user_id: str, session_id: str, query: str, google_api_key: str):
    
    # A. Setup LLM
    llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", google_api_key=google_api_key)
    retriever = LogRetriever(user_id=user_id)
    chat_history = get_history(session_id)

    # B. "Condense Question" Chain
    # Turns "How do I fix it?" + History -> "How do I fix the Database Timeout?"
    condense_system_prompt = (
        "Given the following conversation and a follow up question, "
        "rephrase the follow up question to be a standalone question. "
        "\n\n"
        "IMPORTANT: The chat history contains 'PREVIOUS RETRIEVED CONTEXT'. "
        "If the user asks about specific details (like threads, IDs, timestamps) "
        "that are present in that context, INCLUDE those details in the standalone question."
    )
    condense_prompt = ChatPromptTemplate.from_messages([
        ("system", condense_system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{question}"),
    ])
    
    # This chain returns a STRING (the standalone question)
    condense_chain = (
        condense_prompt 
        | llm 
        | StrOutputParser()
    )

    # C. "Answer" Chain
    qa_system_prompt = (
        "You are a Log Analysis AI. Use the following context to answer the user. "
        "If the answer is not in the logs, say so. Keep it concise.\n\n"
        "Context:\n{context}"
    )
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", qa_system_prompt),
        ("human", "{question}"), # We feed the standalone question here
    ])

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    # D. Execute Logic
    
    # 1. Determine the actual question to ask (using history)
    if chat_history:
        standalone_question = condense_chain.invoke({
            "chat_history": chat_history,
            "question": query
        })
    else:
        standalone_question = query

    # 2. Retrieve Documents manually
    docs = retriever.invoke(standalone_question)
    
    # 3. Generate Answer
    answer_chain = (
        RunnablePassthrough.assign(
            context=lambda x: format_docs(docs)
        )
        | qa_prompt
        | llm
        | StrOutputParser()
    )
    
    response = answer_chain.invoke({"question": standalone_question})

    # 4. Save to Memory
    update_history(session_id, query, response, docs)

    return {
        "answer": response,
        "sources": [{"log_id": d.metadata.get("id"), "content": d.metadata} for d in docs]
    }


def run_cleanup_loop():
    """
    Runs in a background thread. Checks every minute for old sessions.
    """
    while True:
        time.sleep(60) # Check every 1 minute
        current_time = time.time()
        
        # Create a list of IDs to delete (don't modify dict while iterating)
        expired_sessions = [
            sid for sid, data in session_store.items() 
            if current_time - data["last_accessed"] > SESSION_TTL
        ]
        
        for sid in expired_sessions:
            del session_store[sid]
            print(f"Garbage Collector: Removed expired session {sid}")


cleanup_thread = Thread(target=run_cleanup_loop, daemon=True)
cleanup_thread.start()