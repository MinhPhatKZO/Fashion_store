const express = require("express");
const router = express.Router();
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");

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

// ================== 1. create_payment_url ==================
router.post("/create_payment_url", (req, res) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";

  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "127.0.0.1";

  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  let vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURNURL;

  if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
    return res
      .status(500)
      .json({ success: false, message: "VNPAY config is missing" });
  }

  const orderId = moment().format("DDHHmmss");
  const amount = req.body.amount || 1000;
  const bankCode = req.body.bankCode;
  const locale = req.body.language || "vn";

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = secureHash;
  vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

  return res.json({ success: true, paymentUrl: vnpUrl });
});

// ================== 2. vnpay_return ==================
router.get("/vnpay_return", (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (signed === secureHash) {
    return res.json({
      success: true,
      message: "Thanh toán thành công",
      code: vnp_Params["vnp_ResponseCode"],
      data: vnp_Params,
    });
  }

  return res.status(400).json({ success: false, message: "Checksum failed" });
});

// ================== 3. vnpay_ipn ==================
router.post("/vnpay_ipn", (req, res) => {
  let vnp_Params = req.body;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    // TODO: kiểm tra đơn hàng trong DB và cập nhật trạng thái thanh toán
    return res.status(200).json({ RspCode: "00", Message: "Success" });
  }

  return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
});

module.exports = router;
