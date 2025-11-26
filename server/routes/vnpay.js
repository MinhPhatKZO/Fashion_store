// server/routes/vnpay.js
const express = require("express");
const router = express.Router();
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");
const Order = require("../models/Order");

// ================== sort params ==================
function sortObject(obj) {
  let sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    });
  return sorted;
}

// ================== 1. CREATE PAYMENT URL ==================
router.post("/create_payment_url", async (req, res) => {
  try {
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    const { amount, orderId, bankCode, language } = req.body;

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      return res.status(500).json({ success: false, message: "VNPAY config missing" });
    }

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: language || "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId, // gửi orderId từ DB
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    const sortedParams = sortObject(vnp_Params);

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    sortedParams["vnp_SecureHash"] = secureHash;
    vnpUrl += "?" + qs.stringify(sortedParams, { encode: false });

    return res.json({ success: true, paymentUrl: vnpUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Tạo URL thanh toán thất bại" });
  }
});

// ================== 2. VNPay RETURN ==================
router.get("/vnpay_return", async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (signed === secureHash) {
      // ✅ update order status
      const order = await Order.findById(vnp_Params["vnp_TxnRef"]);
      if (order) {
        order.status = "confirmed";
        await order.save();
      }
      return res.json({ success: true, message: "Thanh toán thành công", data: vnp_Params });
    }
    return res.status(400).json({ success: false, message: "Checksum failed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi xử lý VNPay RETURN" });
  }
});

// ================== 3. VNPay IPN ==================
router.post("/vnpay_ipn", async (req, res) => {
  try {
    let vnp_Params = req.body;
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const order = await Order.findById(vnp_Params["vnp_TxnRef"]);
      if (order) {
        order.status = "confirmed";
        await order.save();
      }
      return res.status(200).json({ RspCode: "00", Message: "Success" });
    }
    return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ RspCode: "99", Message: "Server error" });
  }
});

module.exports = router;
