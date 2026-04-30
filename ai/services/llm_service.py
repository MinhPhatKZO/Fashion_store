import ollama
import json
import re

def extract_intent(msg: str):
    prompt = f"Phan tich: '{msg}'. Tra ve JSON: {{'intent': 'tu_van'|'tim_kiem'|'ngoai_le', 'keywords': 'tu_khoa'}}"
    res = ollama.chat(model='qwen2:1.5b', messages=[{'role': 'user', 'content': prompt}], options={"temperature": 0.1})
    try:
        match = re.search(r'\{.*\}', res['message']['content'].replace('\n', ''))
        return json.loads(match.group(0))
    except:
        return {"intent": "tim_kiem", "keywords": msg}

def generate_reply(msg: str, has_products: bool):
    """
    Sinh phản hồi an toàn tuyệt đối. 
    Không cho AI đọc lại raw message để tránh kích hoạt bộ lọc an toàn của mô hình nhỏ.
    """
    if has_products:
        prompt = (
            "Hệ thống ĐÃ TÌM THẤY sản phẩm khách yêu cầu. "
            "Hãy đóng vai nhân viên tư vấn thời trang KZONE, viết DÚNG 1 CÂU vui vẻ mời khách xem sản phẩm bên dưới. "
            "TUYỆT ĐỐI KHÔNG xin lỗi, không giải thích."
        )
    else:
        prompt = (
            "Hệ thống KHÔNG CÓ sản phẩm khách yêu cầu. "
            "Hãy đóng vai nhân viên tư vấn KZONE, viết ĐÚNG 1 CÂU xin lỗi nhẹ nhàng và mời khách xem các sản phẩm khác."
        )

    res = ollama.chat(model='qwen2:1.5b', messages=[
        {'role': 'user', 'content': prompt}
    ], options={
        "temperature": 0.4, 
        "num_predict": 40 # Giới hạn độ dài để AI không nói dông dài
    })
    
    return res['message']['content']