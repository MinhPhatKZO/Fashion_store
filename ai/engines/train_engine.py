import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import json
import os
from .pytorch_model import KZoneNeuMF

class InteractionDataset(Dataset):
    def __init__(self, users, items, scores):
        self.users = torch.tensor(users, dtype=torch.long)
        self.items = torch.tensor(items, dtype=torch.long)
        self.scores = torch.tensor(scores, dtype=torch.float32)

    def __len__(self):
        return len(self.users)

    def __getitem__(self, idx):
        return self.users[idx], self.items[idx], self.scores[idx]

def train_kzone_model(interactions_list, epochs=10, batch_size=128, lr=0.001):
    """Huấn luyện mô hình Deep Learning NeuMF"""
    if not interactions_list:
        return {"status": "failed", "message": "Khong co du lieu de train"}

    # 1. TRỌNG SỐ TƯƠNG TÁC (Implicit Feedback)
    weight_map = {"view": 1.0, "click": 2.0, "add_to_cart": 3.0, "purchase": 5.0}
    
    user2idx, item2idx = {}, {}
    u_idx_counter, i_idx_counter = 0, 0
    users_data, items_data, scores_data = [], [], []

    # 2. XỬ LÝ DỮ LIỆU & ÁNH XẠ ID
    for doc in interactions_list:
        u_id, i_id = str(doc.get("userId")), str(doc.get("productId"))
        i_type = doc.get("type", "view")
        
        if u_id not in user2idx:
            user2idx[u_id] = u_idx_counter
            u_idx_counter += 1
        if i_id not in item2idx:
            item2idx[i_id] = i_idx_counter
            i_idx_counter += 1
            
        users_data.append(user2idx[u_id])
        items_data.append(item2idx[i_id])
        scores_data.append(weight_map.get(i_type, 1.0))

    # Đảm bảo thư mục tồn tại và lưu Mapping
    os.makedirs("data", exist_ok=True)
    with open("data/id_mappings.json", "w") as f:
        json.dump({"user2idx": user2idx, "item2idx": item2idx}, f)

    # 3. CHUẨN BỊ DATALOADER
    dataset = InteractionDataset(users_data, items_data, scores_data)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # 4. KHỞI TẠO MÔ HÌNH NEUMF
    model = KZoneNeuMF(num_users=len(user2idx), num_items=len(item2idx))
    criterion = nn.MSELoss() 
    optimizer = optim.Adam(model.parameters(), lr=lr)

    # 5. VÒNG LẶP HUẤN LUYỆN
    model.train()
    print("--- BAT DAU TRAIN NEUMF MODEL ---")
    for epoch in range(epochs):
        total_loss = 0
        for u_batch, i_batch, s_batch in dataloader:
            optimizer.zero_grad()
            predictions = model(u_batch, i_batch)
            loss = criterion(predictions, s_batch)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"Epoch {epoch+1}/{epochs} | Loss: {total_loss/len(dataloader):.4f}")

    # 6. LƯU TRỌNG SỐ
    os.makedirs("model_weights", exist_ok=True)
    torch.save(model.state_dict(), "model_weights/kzone_mf.pth")
    print("--- HOAN TAT TRAIN MODEL ---")
    
    return {"status": "success", "users_trained": len(user2idx), "items_trained": len(item2idx)}