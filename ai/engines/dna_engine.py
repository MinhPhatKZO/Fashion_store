def extract_user_dna(user_id: str, interactions: list, products_db: dict):
    """
    Trích xuất sở thích cốt lõi (DNA) của người dùng dựa trên lịch sử tương tác.
    """
    if not interactions:
        return {"top_categories": [], "top_brands": []}

    cat_counts = {}
    brand_counts = {}

    for inter in interactions:
        p_id = str(inter.get("productId"))
        product = products_db.get(p_id)
        
        if product:
            cat = product.get("category")
            brand = product.get("brandId")
            
            # Đếm tần suất xuất hiện (Có thể cộng dồn điểm theo loại tương tác nếu muốn sâu hơn)
            if cat:
                cat_counts[cat] = cat_counts.get(cat, 0) + 1
            if brand:
                brand_counts[brand] = brand_counts.get(brand, 0) + 1

    # Sắp xếp và lấy ra Top 3 Category và Top 2 Brand mà khách thích nhất
    top_cats = sorted(cat_counts, key=cat_counts.get, reverse=True)[:3]
    top_brands = sorted(brand_counts, key=brand_counts.get, reverse=True)[:2]

    return {
        "top_categories": top_cats, 
        "top_brands": top_brands
    }