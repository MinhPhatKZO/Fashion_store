const express = require("express");
const router = express.Router();

const Promotion = require("../../models/Promotion");
const { auth, adminAuth } = require("../../middleware/auth");

/* =========================
   GET PROMOTIONS
========================= */
router.get("/", auth, adminAuth, async (req, res) => {
  const data = await Promotion.find().sort({ createdAt: -1 });
  res.json(data);
});

/* =========================
   CREATE
========================= */
router.post("/", auth, adminAuth, async (req, res) => {
  const promo = new Promotion(req.body);
  await promo.save();
  res.json(promo);
});

/* =========================
   UPDATE
========================= */
router.put("/:id", auth, adminAuth, async (req, res) => {
  const updated = await Promotion.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});

/* =========================
   TOGGLE ACTIVE
========================= */
router.patch("/:id/toggle", auth, adminAuth, async (req, res) => {
  const promo = await Promotion.findById(req.params.id);
  promo.active = !promo.active;
  await promo.save();

  res.json(promo);
});

/* =========================
   DELETE
========================= */
router.delete("/:id", auth, adminAuth, async (req, res) => {
  await Promotion.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
