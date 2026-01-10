const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    members: {
      type: Array, 
      required: true,
    },
  },
  { timestamps: true }
);

// Dòng này rất quan trọng: Check xem model đã có chưa để tránh lỗi Overwrite
module.exports = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);