from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import numpy as np
from lightfm import LightFM
from lightfm.data import Dataset

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Kết nối database
db = pymongo.MongoClient("mongodb://localhost:27017/")["fasion_store"]

model = None
dataset = None

@app.post("/train")
def train_model():
    global model, dataset
    print("\n🚀 ĐANG KÍCH HOẠT LIGHTFM (CHẾ ĐỘ TƯƠNG THÍCH CAO)...")

    # A. Lấy dữ liệu
    users = [str(u["_id"]) for u in db.users.find({}, {"_id": 1})]
    items = [str(p["_id"]) for p in db.products.find({}, {"_id": 1})]
    interactions_cursor = db.interactions.find()
    
    valid_u, valid_i = set(users), set(items)
    interactions = []
    for row in interactions_cursor:
        u_id, p_id = str(row["userId"]), str(row["productId"])
        if u_id in valid_u and p_id in valid_i:
            interactions.append((u_id, p_id, float(row.get("score", 1.0))))

    print(f"📊 Đã sẵn sàng {len(interactions)} tương tác để học.")

    if len(interactions) < 10:
        return {"message": "Dữ liệu quá ít, hãy click xem thêm sản phẩm trên Web."}

    # B. Build Dataset
    dataset = Dataset()
    dataset.fit(users=users, items=items)
    (interactions_matrix, _) = dataset.build_interactions(interactions)

    # C. Cấu hình Model SIÊU NHẸ
    # Sử dụng loss='logistic' để tránh lỗi treo luồng trên Windows
    model = LightFM(
        no_components=5, 
        loss='logistic', 
        learning_rate=0.05
    )

    print("🔥 Đang ép AI học (Tiến trình đơn luồng)...")
    try:
        # ÉP CHẠY 1 LUỒNG (num_threads=1) để không bị đóng băng terminal
        model.fit(interactions_matrix, epochs=10, num_threads=1)
        print("🎉 CHÚC MỪNG! LIGHTFM ĐÃ HỌC XONG TRÊN MÁY BẠN.")
        return {"status": "success", "message": "LightFM đã huấn luyện thành công!"}
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/recommend/{user_id}")
def get_recommendations(user_id: str, limit: int = 10):
    if model is None: raise HTTPException(400, "Chưa train model.")
    try:
        user_x = dataset.mapping()[0][user_id]
        all_items = np.array(list(dataset.mapping()[2].values()))
        # Dự đoán điểm số
        scores = model.predict(user_x, all_items)
        top_indices = np.argsort(-scores)[:limit]
        
        inv_map = {v: k for k, v in dataset.mapping()[2].items()}
        return {"recommendations": [inv_map[i] for i in top_indices]}
    except:
        return {"message": "User mới, chưa có dữ liệu gợi ý."}