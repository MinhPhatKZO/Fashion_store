const express = require("express");
const router = express.Router();
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");

// tạo dữ liệu để ký hash
function sortObject(obj) {
  let sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+"); 
    });
  return sorted;
}

router.post("/create_payment_url", (req, res) => {
  try {
    process.env.TZ = "Asia/Ho_Chi_Minh";

    console.log("Request body:", req.body);

    const { orderId, amount, bankCode, language } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Thiếu orderId hoặc amount"
      });
    }

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    // lấy địa chỉ IP của khách hàng gửi yêu cầu 
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      console.error("Missing VNPay config");
      return res.status(500).json({
        success: false,
        message: "Cấu hình VNPay chưa đầy đủ"
      });
    }

    const amountInVND = Math.round(Number(amount)); // chuyển sang vnd
    const locale = language || "vn";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amountInVND * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode; // thêm mã ngân hàng nếu có

    vnp_Params = sortObject(vnp_Params);

    // ghép chuỗi để ký hash
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    //thêm chữ ký vào params
    vnp_Params["vnp_SecureHash"] = secureHash;
  
    vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });
    console.log("Payment URL created:", vnpUrl);
    return res.json({ success: true, paymentUrl: vnpUrl });
  } catch (error) {
    console.error("Create payment URL error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Lỗi tạo URL thanh toán"
    });
  }
});

router.get("/vnpay_return", (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"]; // lấy giá trị chữ ký từ query

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
//ghép chuỗi để ký hash
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
    //kiểm tra đơn hàng trong DB và cập nhật trạng thái thanh toán
    return res.status(200).json({ RspCode: "00", Message: "Success" });
  }

  return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
});

module.exports = router;
