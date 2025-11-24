const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");

// ===== Gemini Config =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.error("❌ Lỗi: GEMINI_API_KEY chưa được cấu hình trong env.example");
}

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message must be a string" });
    }

    // ===================================================================
    // 1. Format history (nếu có)
    // ===================================================================
    const historyParts =
      Array.isArray(history) && history.length > 0
        ? history.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: m.text.slice(0, 1800) }],
          }))
        : [];

    // ===================================================================
    // 2. Lấy dữ liệu sản phẩm liên quan từ MongoDB
    // ===================================================================
    let productContextText = "";

    try {
      const relatedProducts = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: message, $options: "i" } },
          { description: { $regex: message, $options: "i" } },
        ],
      })
        .limit(6)
        .populate("categoryId", "name")
        .lean();

      if (relatedProducts.length > 0) {
        productContextText =
          "Dưới đây là danh sách sản phẩm liên quan từ database:\n\n" +
          relatedProducts
            .map((p) => {
              const categoryName =
                typeof p.categoryId === "object" && p.categoryId
                  ? p.categoryId.name
                  : "Không rõ";

              return (
                `• ${p.name}\n` +
                `  - Giá: ${p.price}₫\n` +
                `  - Danh mục: ${categoryName}\n` +
                `  - Mô tả: ${(p.description || "")
                  .toString()
                  .slice(0, 140)
                  .replace(/\s+/g, " ")}\n`
              );
            })
            .join("\n");
      }
    } catch (dbErr) {
      console.error("❌ Lỗi truy vấn MongoDB:", dbErr);
    }

    // ===================================================================
    // 3. Tạo system instruction
    // ===================================================================
    const systemInstruction =
      `Bạn là trợ lý AI của website thời trang Fashion Store.` +
      `Hãy dùng dữ liệu sản phẩm trong cửa hàng (nếu có) để trả lời.` +
      `Nếu không tìm thấy sản phẩm phù hợp, hãy nói rõ: "Không có trong hệ thống."`;

    const contextParts = productContextText
      ? [
          {
            role: "model",
            parts: [
              {
                text:
                  "Dữ liệu sản phẩm từ database:\n\n" + productContextText,
              },
            ],
          },
        ]
      : [];

    // ===================================================================
    // 4. Request body gửi lên Gemini
    // ===================================================================
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
        ...contextParts,
        ...historyParts,
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    };

    // ===================================================================
    // 5. Gọi API Gemini
    // ===================================================================
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API Error:", data);
      return res.status(500).json({
        error: "Gemini API error",
        detail: data,
      });
    }

    // ===================================================================
    // 6. Extract text trả về
    // ===================================================================
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Xin lỗi, mình chưa thể trả lời yêu cầu này.";

    return res.json({ reply: text });
  } catch (err) {
    console.error("❌ Lỗi /api/ai/chat:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
