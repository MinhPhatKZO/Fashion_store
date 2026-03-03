const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const { auth, adminAuth } = require("../../middleware/auth");

/* =========================
   GET USERS
========================= */
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   LOCK / UNLOCK ACCOUNT
========================= */
router.put("/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;

    // validate rõ ràng
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive phải là boolean" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Không thể khóa admin" });
    }

    user.isActive = isActive;

    await user.save();

    console.log("UPDATED STATUS:", user.isActive);

    res.json({
      message: "Updated status",
      isActive: user.isActive,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE ROLE
========================= */
router.put("/:id/role", auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "seller"].includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    const user = await User.findById(req.params.id);

    if (user.role === "admin") {
      return res.status(403).json({ message: "Không thể sửa admin" });
    }

    user.role = role;
    await user.save();

    res.json({ message: "Updated role", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
