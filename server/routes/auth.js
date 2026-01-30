const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const crypto = require("crypto"); // 👇 Thêm thư viện Crypto

const User = require("../models/User");
const Brand = require("../models/Brands");
const { auth, adminAuth } = require("../middleware/auth");
const { sendOrderEmail } = require("../utils/emailService"); // 👇 Import Email Service

const router = express.Router();

// ==========================
// Google OAuth Client
// ==========================
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Hàm helper tạo token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );
};

/* ==========================
   1. REGISTER (USER THƯỜNG)
========================== */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be > 6 chars"),
    body("phone").notEmpty(),
    body("address").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone, address } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: "User already exists" });

      user = new User({
        name,
        email,
        password,
        phone,
        address,
        role: "user",
      });

      await user.save();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ==========================
   2. REGISTER SELLER
========================== */
router.post(
  "/register-seller",
  [
    body("name").notEmpty().withMessage("Seller name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }),
    body("phone").notEmpty(),
    body("address").notEmpty(),
    body("brandName").notEmpty().withMessage("Brand name is required"),
    body("brandCountry").notEmpty().withMessage("Brand country is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { 
      name, email, password, phone, address,
      brandName, brandCountry, brandDescription, logoUrl 
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let user = await User.findOne({ email }).session(session);
      if (user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Email already registered" });
      }

      user = new User({
        name,
        email,
        password,
        phone,
        address,
        role: "seller",
      });
      await user.save({ session });

      const existingBrand = await Brand.findOne({ name: brandName }).session(session);
      if (existingBrand) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Brand name already taken" });
      }

      const brand = new Brand({
        name: brandName,
        country: brandCountry,
        description: brandDescription || "",
        logoUrl: logoUrl || "",
        sellerId: user._id,
      });
      await brand.save({ session });

      await session.commitTransaction();
      session.endSession();

      const token = generateToken(user);

      res.status(201).json({
        message: "Seller registration successful",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          brandId: brand._id,
          brandName: brand.name
        }
      });

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Seller register error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

/* ==========================
   3. LOGIN
========================== */
router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) return res.status(400).json({ message: "Invalid email or password" });

      if (!user.password) return res.status(400).json({ message: "Account uses social login (Google/Facebook)" });
      if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

      const token = generateToken(user);

      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
      };

      if (user.role === "seller") {
        const brand = await Brand.findOne({ sellerId: user._id });
        if (brand) {
          userResponse.brandId = brand._id;
          userResponse.brandName = brand.name;
          userResponse.brandLogo = brand.logoUrl;
        }
      }

      res.json({
        message: "Login successful",
        token,
        user: userResponse,
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ==========================
   4. GOOGLE LOGIN
========================== */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Missing Google credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        avatar: picture,
        googleId: sub,
        role: "user",
        password: null,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = sub;
      user.avatar = picture || user.avatar;
      await user.save();
    }

    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });

    const token = generateToken(user);
    
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
      avatar: user.avatar,
    };

    if (user.role === "seller") {
      const brand = await Brand.findOne({ sellerId: user._id });
      if (brand) {
        userResponse.brandId = brand._id;
        userResponse.brandName = brand.name;
      }
    }

    res.json({ message: "Google login successful", token, user: userResponse });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Google authentication failed" });
  }
});

/* ==========================
   5. FACEBOOK LOGIN
========================== */
router.post("/facebook", async (req, res) => {
  try {
    const { accessToken, userID } = req.body;
    if (!accessToken || !userID) return res.status(400).json({ message: "Missing FB data" });

    const url = `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`;
    const response = await axios.get(url);
    const { email, name, picture, id } = response.data;

    if (id !== userID) return res.status(401).json({ message: "Invalid FB ID" });

    let user = await User.findOne({ $or: [{ facebookId: id }, { email: email }] });

    if (user) {
      if (!user.facebookId) user.facebookId = id;
      if (!user.avatar && picture) user.avatar = picture.data.url;
      await user.save();
    } else {
      user = new User({
        name,
        email: email || `${id}@facebook.com`,
        password: null,
        facebookId: id,
        avatar: picture?.data?.url || "",
        role: "user",
        isActive: true
      });
      await user.save();
    }

    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });

    const token = generateToken(user);
    
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
      avatar: user.avatar
    };

    if (user.role === "seller") {
        const brand = await Brand.findOne({ sellerId: user._id });
        if (brand) {
          userResponse.brandId = brand._id;
          userResponse.brandName = brand.name;
        }
    }

    res.json({ message: "Facebook login successful", token, user: userResponse });

  } catch (err) {
    console.error("FB Login Error:", err.message);
    res.status(401).json({ message: "Facebook authentication failed" });
  }
});

/* ==============================================
   6. QUÊN MẬT KHẨU (Gửi mail) - MỚI
============================================== */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
    }

    // 1. Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString("hex");

    // 2. Lưu token vào DB (Hash token để bảo mật - ở đây lưu thẳng cho đơn giản)
    // Token hết hạn sau 10 phút
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // 3. Tạo Link Reset
    const resetUrl = `${process.env.WEB_URL}/reset-password/${resetToken}`;

    // 4. Gửi Email
    // Giả lập data object để tái sử dụng hàm sendOrderEmail
    const emailData = {
      user: { name: user.name, email: user.email },
      resetUrl: resetUrl
    };

    await sendOrderEmail(emailData, "Reset_Password");

    res.json({ success: true, message: "Đã gửi email hướng dẫn đặt lại mật khẩu!" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ==============================================
   7. ĐẶT LẠI MẬT KHẨU MỚI - MỚI
============================================== */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const resetToken = req.params.token;
    
    // Tìm user có token trùng khớp và CHƯA hết hạn
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" });
    }

    // Đặt mật khẩu mới
    user.password = req.body.password;
    
    // Xóa token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Lưu lại (sẽ kích hoạt pre-save hook để hash password)
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ==========================
   8. PROFILE
========================== */
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    let brandInfo = null;
    if (user.role === 'seller') {
        brandInfo = await Brand.findOne({ sellerId: user._id });
    }

    res.json({ user, brand: brandInfo });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   9. ADMIN: GET ALL USERS
========================== */
router.get("/all", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;