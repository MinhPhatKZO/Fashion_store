const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: String,
    description: String,
    logoUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
