from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

class RecommendRequest(BaseModel):
    user_id: str
    recent_item_ids: List[str] = [] # Danh sách sản phẩm khách vừa xem trong session