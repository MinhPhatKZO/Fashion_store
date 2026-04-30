def extract_session_intent(recent_item_ids: list, products_db: dict):
    """
    Đoán ý định mua sắm hiện tại dựa trên các click cuối cùng trong phiên (session).
    """
    if not recent_item_ids:
        return {"intent": "browse", "focus_category": None}

    cat_counts = {}
    for p_id in recent_item_ids:
        product = products_db.get(str(p_id))
        if product:
            cat = product.get("category")
            if cat:
                cat_counts[cat] = cat_counts.get(cat, 0) + 1

    if not cat_counts:
        return {"intent": "browse", "focus_category": None}

    # Tìm danh mục được xem nhiều nhất trong phiên hiện tại
    dominant_cat = max(cat_counts, key=cat_counts.get)
    
    # Nếu xem > 2 sản phẩm cùng danh mục -> Xác định là đang có ý định mua rõ ràng (shopping)
    intent = "shopping" if cat_counts[dominant_cat] >= 2 else "browse"

    return {
        "intent": intent, 
        "focus_category": dominant_cat
    }