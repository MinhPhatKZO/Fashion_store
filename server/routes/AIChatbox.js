const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");

// ===== Gemini Config =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY chưa được cấu hình trong .env");
}

// Helper: Escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    // Validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message must be a non-empty string" });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ error: "message cannot be empty" });
    }

    // ===================================================================
    // 1. Format history (với validation)
    // ===================================================================
    const historyParts =
      Array.isArray(history) && history.length > 0
        ? history
            .filter(m => m && typeof m.text === 'string' && m.sender)
            .map((m) => ({
              role: m.sender === "user" ? "user" : "model",
              parts: [{ text: m.text.slice(0, 1800) }],
            }))
        : [];

    // ===================================================================
    // 2. Lấy dữ liệu sản phẩm liên quan từ MongoDB
    // ===================================================================
    let productContextText = "";

    try {
      const searchPattern = escapeRegex(message.trim());
      
      const relatedProducts = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: searchPattern, $options: "i" } },
          { description: { $regex: searchPattern, $options: "i" } },
        ],
      })
        .limit(6)
        .populate("categoryId", "name")
        .lean()
        .maxTimeMS(5000); // Timeout 5s cho query

      if (relatedProducts.length > 0) {
        productContextText =
          "Dưới đây là danh sách sản phẩm liên quan từ database:\n\n" +
          relatedProducts
            .map((p) => {
              const categoryName =
                typeof p.categoryId === "object" && p.categoryId
                  ? p.categoryId.name
                  : "Không rõ";

              const description = (p.description || "")
                .toString()
                .slice(0, 140)
                .replace(/\s+/g, " ")
                .trim();

              return (
                `• ${p.name}\n` +
                `  - Giá: ${p.price.toLocaleString('vi-VN')}₫\n` +
                `  - Danh mục: ${categoryName}\n` +
                `  - Mô tả: ${description}\n`
              );
            })
            .join("\n");
      }
    } catch (dbErr) {
      console.error("❌ Lỗi truy vấn MongoDB:", dbErr);
      // Không throw error, vẫn tiếp tục với context rỗng
    }

    // ===================================================================
    // 3. Tạo system instruction
    // ===================================================================
    const systemInstruction =
      `Bạn là trợ lý AI của website thời trang Fashion Store. ` +
      `Hãy dùng dữ liệu sản phẩm trong cửa hàng (nếu có) để trả lời. ` +
      `Nếu không tìm thấy sản phẩm phù hợp, hãy nói rõ: "Không có trong hệ thống." ` +
      `Trả lời ngắn gọn, thân thiện và chuyên nghiệp.`;

    const contextParts = productContextText
      ? [
          {
            role: "model",
            parts: [
              {
                text: "Dữ liệu sản phẩm từ database:\n\n" + productContextText,
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
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    // ===================================================================
    // 5. Gọi API Gemini với timeout
    // ===================================================================
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Gemini API Error:", data);
        return res.status(response.status).json({
          error: "Gemini API error",
          detail: data.error?.message || "Unknown error",
        });
      }

      // ===================================================================
      // 6. Extract text trả về
      // ===================================================================
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Xin lỗi, mình chưa thể trả lời yêu cầu này.";

      return res.json({ reply: text });

    } catch (fetchErr) {
      clearTimeout(timeout);
      
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ 
          error: "Request timeout", 
          message: "AI đang quá tải, vui lòng thử lại sau" 
        });
      }
      
      throw fetchErr; // Re-throw để outer catch xử lý
    }

  } catch (err) {
    console.error("❌ Lỗi /api/ai/chat:", err);
    return res.status(500).json({ 
      error: "Internal server error",
      message: "Đã xảy ra lỗi, vui lòng thử lại sau"
    });
  }
});

module.exports = router;