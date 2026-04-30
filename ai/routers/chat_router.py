from fastapi import APIRouter
from models.schemas import ChatRequest
from services import llm_service, vector_service
from core.database import db
from bson.objectid import ObjectId

router = APIRouter(prefix="/chat", tags=["Chatbot"])

# 1. BẢN VÁ CORS: Xóa dấu "/" ở đây để không bị React block (Lỗi Redirect 307)
@router.post("")
def chat_endpoint(req: ChatRequest):
    msg = req.message.lower()

    if "ignore" in msg: 
        return {"reply": "Yeu cau khong hop le.", "products": []}

    extracted = llm_service.extract_intent(msg)
    
    # 2. BẢN VÁ KEYERROR (Intent): Dùng .get() an toàn
    if extracted.get('intent') == "ngoai_le":
        return {"reply": "KZONE chi ho tro thoi trang.", "products": []}

    # 3. BẢN VÁ KEYERROR & ATTRIBUTE ERROR (Keywords)
    raw_keywords = extracted.get('keywords', msg)
    if isinstance(raw_keywords, list):
        search_query = " ".join(raw_keywords) # Nối list thành chuỗi nếu AI trả về mảng
    else:
        search_query = str(raw_keywords)      # Ép kiểu về chuỗi cho chắc chắn

    # ==========================================
    # 4. CƠ CHẾ TÌM KIẾM HYBRID (MONGODB REGEX + FAISS)
    # Xử lý triệt để lỗi tiếng Việt (Tìm "áo sơ mi" ra đúng "áo sơ mi")
    # ==========================================
    top_products = []
    
    # Ưu tiên 1: Lọc bằng MongoDB (Tên sản phẩm PHẢI chứa đủ các từ khóa)
    words = search_query.split()
    query_conditions = [{"name": {"$regex": word, "$options": "i"}} for word in words]
    
    exact_matches = []
    if query_conditions:
        cursor = db.products.find({"$and": query_conditions}).limit(8)
        exact_matches = list(cursor)

    if exact_matches:
        # Nếu Mongo tìm trúng phóc cụm từ
        for p in exact_matches:
            top_products.append({
                "_id": str(p["_id"]),
                "name": p.get("name"),
                "price": p.get("price"),
                "image": p.get("images")[0].get("url") if p.get("images") else ""
            })
    else:
        # Ưu tiên 2: Nếu Mongo bó tay (kho không có), mới nhờ FAISS tìm đồ tương tự
        semantic_scores = vector_service.get_semantic_candidates(search_query)
        for pid in list(semantic_scores.keys())[:8]:
            if pid:
                p = db.products.find_one({"_id": ObjectId(pid)})
                if p:
                    top_products.append({
                        "_id": str(p["_id"]),
                        "name": p.get("name"),
                        "price": p.get("price"),
                        "image": p.get("images")[0].get("url") if p.get("images") else ""
                    })

    # ==========================================
    # 5. GỌI LLM SINH PHẢN HỒI (FEW-SHOT PROMPTING)
    # ==========================================
    reply_text = llm_service.generate_reply(msg, len(top_products) > 0)

    return {
        "success": True,
        "reply": reply_text,
        "products": top_products
    }