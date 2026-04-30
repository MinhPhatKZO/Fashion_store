import torch
import torch.nn as nn

class KZoneNeuMF(nn.Module):
    def __init__(self, num_users, num_items, mf_dim=32, mlp_dim=32):
        super(KZoneNeuMF, self).__init__()
        # Nhánh GMF (Ghi nhớ tương tác tuyến tính)
        self.embed_user_mf = nn.Embedding(num_users, mf_dim)
        self.embed_item_mf = nn.Embedding(num_items, mf_dim)
        
        # Nhánh MLP (Học quy luật phi tuyến sâu)
        self.embed_user_mlp = nn.Embedding(num_users, mlp_dim)
        self.embed_item_mlp = nn.Embedding(num_items, mlp_dim)
        
        self.fc_layers = nn.Sequential(
            nn.Linear(mlp_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16)
        )
        
        # Hợp nhất GMF và MLP
        self.prediction = nn.Linear(mf_dim + 16, 1)

    def forward(self, user_indices, item_indices):
        user_mf = self.embed_user_mf(user_indices)
        item_mf = self.embed_item_mf(item_indices)
        mf_vector = torch.mul(user_mf, item_mf)
        
        user_mlp = self.embed_user_mlp(user_indices)
        item_mlp = self.embed_item_mlp(item_indices)
        mlp_vector = torch.cat([user_mlp, item_mlp], dim=-1)
        mlp_vector = self.fc_layers(mlp_vector)
        
        combined = torch.cat([mf_vector, mlp_vector], dim=-1)
        return self.prediction(combined).squeeze()