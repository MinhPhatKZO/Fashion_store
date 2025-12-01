const express = require("express");
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

const Product = require("../models/Product");

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY chưa được cấu hình trong .env (server)");
}

router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    // ====== Chuẩn hoá lịch sử chat ======
    const historyParts =
      Array.isArray(history) && history.length > 0
        ? history.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: m.text.slice(0, 2000) }],
          }))
        : [];

    // ====== Tìm sản phẩm liên quan trong MongoDB ======
    let productContextText = "";
    let productsForClient = [];

    try {
      console.log("💬 AI query message:", message);

      // Tách message thành từ khoá
      const keywords = message
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "") // bỏ ký tự đặc biệt
        .split(/\s+/)
        .filter(Boolean);

      console.log("🔑 Keywords:", keywords);

      let relatedProducts = [];

      if (keywords.length > 0) {
        // Chỉ cần khớp ÍT NHẤT 1 từ khoá
        const textConditions = keywords.map((word) => ({
          $or: [
            { name: { $regex: word, $options: "i" } },
            { description: { $regex: word, $options: "i" } },
          ],
        }));

        const mongoQuery = { $or: textConditions };
        console.log("🔎 Mongo query (keywords):", JSON.stringify(mongoQuery));

        relatedProducts = await Product.find(mongoQuery)
          .limit(5)
          .populate("categoryId", "name")
          .lean();
      }

      // Nếu dùng keywords vẫn không ra gì → fallback tìm nguyên câu
      if (!relatedProducts || relatedProducts.length === 0) {
        const simpleTerm = message.trim();
        if (simpleTerm) {
          const fallbackQuery = {
            $or: [
              { name: { $regex: simpleTerm, $options: "i" } },
              { description: { $regex: simpleTerm, $options: "i" } },
            ],
          };
          console.log(
            "🔁 Fallback Mongo query (full text):",
            JSON.stringify(fallbackQuery)
          );

          relatedProducts = await Product.find(fallbackQuery)
            .limit(5)
            .populate("categoryId", "name")
            .lean();
        }
      }

      console.log(
        "✅ Found products for AI:",
        relatedProducts ? relatedProducts.length : 0
      );

      // 🚫 NẾU HOÀN TOÀN KHÔNG CÓ SẢN PHẨM TRONG DB
      if (!relatedProducts || relatedProducts.length === 0) {
        const noProductReply =
          "Chào bạn, hiện tại trong hệ thống *không có* sản phẩm nào phù hợp với mô tả: \"" +
          message +
          "\".\n" +
          "Bạn thử tìm bằng từ khoá khác (ví dụ thêm thương hiệu, loại sản phẩm, mức giá, v.v.) giúp mình nhé.";

        // ⛔ Không gọi Gemini nữa, trả về luôn
        return res.json({
          reply: noProductReply,
          products: [], // FE sẽ không hiện nút “Xem sản phẩm”
        });
      }

      // ✅ Nếu CÓ sản phẩm thì chuẩn bị context cho Gemini + data trả về FE
      productContextText =
        "Dưới đây là một số sản phẩm trong database có thể liên quan đến câu hỏi của khách:\n" +
        relatedProducts
          .map((p) => {
            const categoryName =
              typeof p.categoryId === "object" && p.categoryId
                ? p.categoryId.name
                : "";
            const desc =
              (p.description || "").toString().slice(0, 160).replace(/\s+/g, " ");
            return `- ID: ${p._id}
  Tên: ${p.name}
  Giá: ${p.price}₫
  Danh mục: ${categoryName}
  Mô tả: ${desc}`;
          })
          .join("\n\n");

      productsForClient = relatedProducts.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
      }));
    } catch (dbErr) {
      console.error("❌ Lỗi khi lấy dữ liệu sản phẩm cho AI:", dbErr);
    }

    // ====== System prompt ======
    const systemInstruction =
      "Bạn là trợ lý AI của website thời trang Fashion Store. " +
      "Luôn ưu tiên sử dụng dữ liệu sản phẩm được cung cấp trong ngữ cảnh để trả lời. " +
      "Không tự bịa ra sản phẩm không tồn tại trong dữ liệu. " +
      "Nếu không tìm thấy sản phẩm phù hợp trong dữ liệu, hãy nói rõ là không tìm thấy trong hệ thống. " +
      "Khi gợi ý sản phẩm, hãy mô tả ngắn gọn và nêu tên & giá.";

    const contextParts = [
      {
        role: "user",
        parts: [
          {
            text:
              "Dưới đây là dữ liệu sản phẩm lấy trực tiếp từ database của cửa hàng. " +
              "Hãy dựa vào thông tin này để trả lời khách:\n\n" +
              productContextText,
          },
        ],
      },
    ];

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Gemini API error:", errText);
      return res.status(500).json({ error: "Gemini API error", detail: errText });
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Xin lỗi, hiện mình chưa thể trả lời. Bạn thử lại sau nhé!";

    // Trả về cho FE: câu trả lời + danh sách sản phẩm (để hiện nút Xem sản phẩm)
    return res.json({
      reply: text,
      products: productsForClient,
    });
  } catch (err) {
    console.error("❌ Lỗi /api/ai/chat:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
