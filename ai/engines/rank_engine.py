import torch
import json
import os
from .pytorch_model import KZoneNeuMF

def rank_products(user_id, recent_item_ids, user_dna, session_data, products_list):
    # Load Mappings & Model
    mapping_path = "data/id_mappings.json"
    model_path = "model_weights/kzone_mf.pth"
    
    if not os.path.exists(mapping_path) or not os.path.exists(model_path):
        return [str(p["_id"]) for p in products_list[:10]]

    with open(mapping_path, "r") as f:
        mappings = json.load(f)
    user2idx, item2idx = mappings["user2idx"], mappings["item2idx"]
    
    model = KZoneNeuMF(len(user2idx), len(item2idx))
    model.load_state_dict(torch.load(model_path))
    model.eval()

    u_idx = user2idx.get(user_id)
    # Trọng số động: Khách mới (Cold-start) ưu tiên Session, khách quen ưu tiên AI
    w_ai = 0.6 if u_idx is not None else 0.0
    w_hybrid = 1.0 - w_ai

    scored_items = []
    with torch.no_grad():
        for product in products_list:
            p_id = str(product["_id"])
            if p_id in recent_item_ids: continue

            # 1. AI Score (PyTorch)
            ai_score = 0.0
            if u_idx is not None and p_id in item2idx:
                pred = model(torch.tensor([u_idx]), torch.tensor([item2idx[p_id]]))
                ai_score = torch.sigmoid(pred).item()

            # 2. Hybrid Score (Session & DNA)
            session_match = 1.0 if product.get("category") == session_data["focus_category"] else 0.0
            dna_match = 1.0 if product.get("brandId") in user_dna["top_brands"] else 0.0
            hybrid_score = (session_match * 0.7) + (dna_match * 0.3)

            # Final Ranking
            final_score = (w_ai * ai_score) + (w_hybrid * hybrid_score)
            scored_items.append((p_id, final_score))

    scored_items.sort(key=lambda x: x[1], reverse=True)
    return [item[0] for item in scored_items[:10]]