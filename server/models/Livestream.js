const mongoose = require("mongoose");

const LivestreamSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["upcoming", "live", "ended"], default: "upcoming" },
  
  // Sản phẩm sẽ bán trong buổi live
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  
  // Sản phẩm đang được GHIM hiện tại (để hiện popup cho người xem)
  currentProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  agoraChannel: { type: String }, // Tên phòng livestream
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Livestream", LivestreamSchema);