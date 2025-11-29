// routes/brands.js
const express = require("express");
const router = express.Router();
const Brand = require("../models/Brands");

// Lấy danh sách tất cả brands
router.get("/", async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 }); // sort alphabetically
    res.json(brands); // trả về mảng brand
  } catch (err) {
    console.error("Lỗi khi lấy brands:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
