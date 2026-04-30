import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
index_faiss = faiss.IndexFlatL2(384)
product_id_map = {}

def train_faiss(db):
    """Hàm nạp toàn bộ sản phẩm từ MongoDB vào Vector FAISS"""
    global index_faiss, product_id_map
    products = list(db.products.find({}, {"_id": 1, "name": 1, "description": 1}))
    
    if not products:
        return
        
    index_faiss.reset() # Xóa trí nhớ cũ
    product_id_map.clear()
    
    texts = []
    for i, p in enumerate(products):
        text = f"{p.get('name', '')} {p.get('description', '')}".strip()
        texts.append(text)
        product_id_map[i] = str(p["_id"])
        
    # Mã hóa và đưa vào FAISS
    vectors = embedder.encode(texts, convert_to_numpy=True)
    index_faiss.add(vectors)
    print(f"FAISS: Da nap thanh cong {len(products)} san pham vao bo nho.")

def get_semantic_candidates(query_text: str, k=10):
    if index_faiss.ntotal == 0: return {}
    
    # Ép kiểu dữ liệu (đã làm ở các bước trước)
    if isinstance(query_text, list):
        query_text = " ".join(query_text)
    elif not isinstance(query_text, str):
        query_text = str(query_text)
        
    vector = embedder.encode([query_text.lower()], convert_to_numpy=True)
    distances, indices = index_faiss.search(vector, k)
    
    scores = {}
    for i, idx in enumerate(indices[0]):
        # SIẾT CHẶT NGƯỠNG FAISS: Chỉ chấp nhận khoảng cách cực nhỏ (< 22.0)
        # Nếu lớn hơn 22.0 nghĩa là hàng không liên quan (VD: Quần vs Áo), loại bỏ ngay!
        if idx != -1 and distances[0][i] < 22.0: 
            scores[product_id_map.get(idx)] = 100 - distances[0][i]
    return scores