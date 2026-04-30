from fastapi import APIRouter
from models.schemas import RecommendRequest
from core.database import db
from engines import dna_engine, session_engine, rank_engine, train_engine

router = APIRouter(prefix="/api/ai", tags=["Recommendation"])

@router.post("/train")
def train_model():
    interactions = list(db.interactions.find({}))
    metrics = train_engine.train_kzone_model(interactions)
    return {"success": True, "metrics": metrics}

@router.post("/recommend")
def get_recommend(req: RecommendRequest):
    # Lấy dữ liệu thô từ DB
    user_interactions = list(db.interactions.find({"userId": req.user_id}))
    all_products = list(db.products.find({}))
    products_db = {str(p["_id"]): p for p in all_products}

    # Chạy Pipeline 3 bước
    dna = dna_engine.extract_user_dna(req.user_id, user_interactions, products_db)
    session = session_engine.extract_session_intent(req.recent_item_ids, products_db)
    
    top_ids = rank_engine.rank_products(req.user_id, req.recent_item_ids, dna, session, all_products)
    
    return {"success": True, "recommended_products": top_ids}