const mongoose = require("mongoose");

const VariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  sku: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  price: { type: Number, required: true },
  comparePrice: { type: Number },
  stock: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Variant", VariantSchema);