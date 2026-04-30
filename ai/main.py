import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_db, db
from routers import chat_router
from routers import recsys_router
from services.vector_service import train_faiss

app = FastAPI(title="KZONE AI SYSTEM")

@app.middleware("http")
async def measure_latency(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000 
    
    if request.url.path == "/api/ai/train":
        print(f"[KZONE Monitor] Qua trinh TRAIN AI hoan tat trong: {process_time:.2f} ms")
        
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()
    print("DANG NAP KHO HANG VAO AI... VUI LONG DOI...")
    train_faiss(db)
    print("He thong AI da san sang!")

app.include_router(chat_router.router)
app.include_router(recsys_router.router)