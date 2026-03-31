from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymongo
import numpy as np
from lightfm import LightFM
from lightfm.data import Dataset
import ollama  
import re  
from bson.objectid import ObjectId # NÂNG CẤP: Thêm ObjectId để truy vấn DB

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Kết nối database
db = pymongo.MongoClient("mongodb://localhost:27017/")["fasion_store"]

model = None
dataset = None

# ==========================================
# PHẦN 1: MÔ HÌNH GỢI Ý TRUYỀN THỐNG (LIGHTFM)
# ==========================================
@app.post("/train")
def train_model():
    global model, dataset
    print("\n ĐANG KÍCH HOẠT LIGHTFM (CHẾ ĐỘ TƯƠNG THÍCH CAO)...")

    users = [str(u["_id"]) for u in db.users.find({}, {"_id": 1})]
    items = [str(p["_id"]) for p in db.products.find({}, {"_id": 1})]
    interactions_cursor = db.interactions.find()
    
    valid_u, valid_i = set(users), set(items)
    interactions = []
    for row in interactions_cursor:
        u_id, p_id = str(row["userId"]), str(row["productId"])
        if u_id in valid_u and p_id in valid_i:
            interactions.append((u_id, p_id, float(row.get("score", 1.0))))

    if len(interactions) < 10:
        return {"message": "Dữ liệu quá ít, hãy click xem thêm sản phẩm trên Web."}

    dataset = Dataset()
    dataset.fit(users=users, items=items)
    (interactions_matrix, _) = dataset.build_interactions(interactions)

    model = LightFM(no_components=5, loss='logistic', learning_rate=0.05)

    try:
        model.fit(interactions_matrix, epochs=10, num_threads=1)
        print(" CHÚC MỪNG! LIGHTFM ĐÃ HỌC XONG TRÊN MÁY BẠN.")
        return {"status": "success", "message": "LightFM đã huấn luyện thành công!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/recommend/{user_id}")
def get_recommendations(user_id: str, limit: int = 10):
    if model is None: raise HTTPException(400, "Chưa train model.")
    try:
        user_x = dataset.mapping()[0][user_id]
        all_items = np.array(list(dataset.mapping()[2].values()))
        scores = model.predict(user_x, all_items)
        top_indices = np.argsort(-scores)[:limit]
        
        inv_map = {v: k for k, v in dataset.mapping()[2].items()}
        return {"recommendations": [inv_map[i] for i in top_indices]}
    except:
        return {"message": "User mới, chưa có dữ liệu gợi ý."}

# ==========================================
# PHẦN 2: [NÂNG CẤP] GỢI Ý REAL-TIME THEO SESSION
# ==========================================
class SessionRequest(BaseModel):
    recent_item_ids: list[str]  # Mảng ID gửi từ Cookie/LocalStorage lên
    limit: int = 10

@app.post("/recommend/session")
def session_based_recommendation(req: SessionRequest):
    """
    GỢI Ý REAL-TIME: Bắt mạch mục đích tức thời của khách dựa trên những gì họ vừa xem.
    Thuật toán sẽ lấy "Trung bình cộng" gu thời trang của các món khách vừa lướt.
    """
    if model is None: 
        return {"success": False, "message": "Chưa train model."}
    
    try:
        item_map = dataset.mapping()[2]
        valid_internal_ids = []
        
        # 1. Lọc ra những món trong Cookie mà AI đã từng học
        for p_id in req.recent_item_ids:
            if p_id in item_map:
                valid_internal_ids.append(item_map[p_id])
                
        if not valid_internal_ids:
            return {"success": False, "message": "Sản phẩm quá mới hoặc khách chưa xem gì."}

        # 2. Rút trích Não bộ AI (Item Embeddings)
        _, item_embeddings = model.get_item_representations()
        
        # 3. TÍNH TOÁN "MỤC ĐÍCH HIỆN TẠI"
        # Trộn (Trung bình cộng) đặc điểm các món vừa xem để tạo ra Tọa độ ý định
        recent_embeddings = item_embeddings[valid_internal_ids]
        current_intent_vector = np.mean(recent_embeddings, axis=0)

        # 4. Quét kho hàng tìm món hợp với "Tọa độ ý định" này nhất
        scores = item_embeddings.dot(current_intent_vector)

        # 5. Sắp xếp điểm và lọc kết quả
        top_indices = np.argsort(-scores)
        inv_map = {v: k for k, v in item_map.items()}
        
        suggested_products = []
        count = 0
        
        for idx in top_indices:
            p_id_str = inv_map[idx]
            # Loại trừ: Không gợi ý lại đúng những cái khách ĐÃ có trong lịch sử (Cookie)
            if p_id_str not in req.recent_item_ids:
                p = db.products.find_one({"_id": ObjectId(p_id_str)})
                if p:
                    img_url = p["images"][0].get("url", "") if p.get("images") and len(p["images"]) > 0 else p.get("image", "")
                    suggested_products.append({
                        "_id": str(p["_id"]),
                        "name": p.get("name"),
                        "price": p.get("price"),
                        "image": img_url
                    })
                    count += 1
            if count >= req.limit:
                break

        return {
            "success": True, 
            "recommendations": suggested_products
        }

    except Exception as e:
        print(f"Lỗi Session Recommend: {e}")
        return {"success": False, "message": str(e)}

# ==========================================
# PHẦN 3: CHATBOT TƯ VẤN THÔNG MINH (QWEN2:1.5B)
# ==========================================
class ChatRequest(BaseModel):
    message: str
    brand_id: str = None 

@app.post("/chat")
def chat_with_llama(req: ChatRequest):
    try:
        print(f"\n Khách nhắn: {req.message}")
        msg_lower = req.message.lower()
        
        # 1. NHẬN DIỆN Ý ĐỊNH (Tư vấn vs Tìm kiếm cụ thể)
        advice_keywords = ["tư vấn", "gợi ý", "chọn đồ", "phối đồ", "mặc gì", "phù hợp", "tặng", "đi tiệc", "đi chơi", "thể thao", "style"]
        is_advice = any(kw in msg_lower for kw in advice_keywords)
        
        query = {"brandId": req.brand_id} if req.brand_id else {}
        search_term = ""

        if is_advice:
            # LUỒNG 1: TƯ VẤN THÔNG MINH THEO NGỮ CẢNH
            if "thể thao" in msg_lower or "gym" in msg_lower or "chạy" in msg_lower:
                query["name"] = {"$regex": "thể thao|gym|bra|chạy|sneaker|giày", "$options": "i"}
            elif "tiệc" in msg_lower or "cưới" in msg_lower:
                query["name"] = {"$regex": "váy|đầm|sơ mi|vest|blazer|túi|gucci", "$options": "i"}
            elif "đi chơi" in msg_lower or "cà phê" in msg_lower or "cafe" in msg_lower or "dạo" in msg_lower:
                query["name"] = {"$regex": "thun|jeans|váy|polo|khoác", "$options": "i"}
            else:
                query["name"] = {"$regex": "áo|quần|váy|giày", "$options": "i"} 
        else:
            # LUỒNG 2: TÌM CHÍNH XÁC MÓN KHÁCH GỌI
            stop_words = {"cho", "mình", "tôi", "muốn", "xem", "mua", "tìm", "kiếm", "cần", "có", "không", "một", "cái", "chiếc", "những", "các", "nhé", "với", "ạ", "thử", "hỏi", "bạn", "shop", "ơi", "lấy", "đây", "giúp", "về", "đồ", "nào", "gì", "là", "này"}
            words = msg_lower.split()
            keywords = [w for w in words if w not in stop_words]
            
            search_term = " ".join(keywords)
            
            if keywords:
                query["$and"] = [{"name": {"$regex": k, "$options": "i"}} for k in keywords]

        # 2. TRUY VẤN DATABASE
        products_cursor = list(db.products.find(query).limit(15))
        is_fallback = False
        
        # Nếu kho không có hàng, bốc 10 món bất kỳ ra gợi ý
        if len(products_cursor) == 0:
            is_fallback = True
            fallback_query = {"brandId": req.brand_id} if req.brand_id else {}
            products_cursor = list(db.products.find(fallback_query).limit(10)) 

        # 3. ĐÓNG GÓI HÌNH ẢNH CHO REACT
        suggested_products = [] 
        for p in products_cursor:
            img_url = ""
            if p.get("images") and len(p["images"]) > 0:
                img_url = p["images"][0].get("url", "")
            elif p.get("image"):
                img_url = p.get("image")

            suggested_products.append({
                "_id": str(p["_id"]),
                "name": p.get("name"),
                "price": p.get("price"),
                "image": img_url
            })

        # 4. KỊCH BẢN KỶ LUẬT THÉP CHO AI
        if is_advice:
            system_prompt = "Bạn là nhân viên tư vấn KZONE. Lệnh: Trả lời khách bằng ĐÚNG 1 CÂU NGẮN GỌN đưa ra lời khuyên chung chung và mời khách xem ảnh. Tuyệt đối không kể tên sản phẩm."
        else:
            if is_fallback:
                system_prompt = f"Bạn là lễ tân KZONE. Khách tìm '{search_term}' nhưng HẾT HÀNG. Lệnh: Trả lời đúng 1 câu duy nhất xin lỗi và mời xem các mẫu khác bên dưới."
            else:
                system_prompt = f"Bạn là lễ tân KZONE. Khách tìm '{search_term}' và CÓ HÀNG. Lệnh: Trả lời đúng 1 câu duy nhất vui vẻ báo có hàng và mời xem ảnh."

        # 5. GỌI OLLAMA (CÓ TRANG BỊ VŨ KHÍ KHÓA MÕM)
        print("🤖 AI đang suy nghĩ...")
        response = ollama.chat(model='qwen2:1.5b', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': req.message}
        ], options={
            "temperature": 0.2, 
            "num_predict": 50   
        })

        reply_text = response['message']['content']
        print(f" AI trả lời:\n{reply_text}")
        
        return {
            "success": True, 
            "reply": reply_text,
            "products": suggested_products 
        }

    except Exception as e:
        print(f" Lỗi Chatbot: {e}")
        return {"success": False, "reply": "Xin lỗi, hiện tại trợ lý AI đang bận. Bạn quay lại sau nhé!"}