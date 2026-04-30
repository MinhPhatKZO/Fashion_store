const express = require("express");
const router = express.Router();
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");

// Import Model Order
const Order = require("../models/Order");
// Import hàm gửi email
const { sendOrderEmail } = require("../utils/emailService");

// --- CẤU HÌNH ---
// Đã ẩn hoàn toàn thông tin, chỉ lấy từ biến môi trường (.env)
const tmnCode = process.env.VNP_TMNCODE;
const secretKey = process.env.VNP_HASHSECRET;
const vnpUrl = process.env.VNP_URL;
const returnUrl = process.env.VNP_RETURNURL; 

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// 1. TẠO URL THANH TOÁN
router.post("/create_payment_url", (req, res) => {
  try {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    let ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    if (ipAddr === '::1') ipAddr = '127.0.0.1';

    const { orderId, amount, bankCode, language } = req.body;
    
    // Kiểm tra cấu hình .env, nếu thiếu sẽ báo lỗi ngay lập tức
    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
       console.error("Lỗi: Thiếu biến môi trường VNPay trong file .env");
       return res.status(500).json({ success: false, message: "Thiếu Config VNPay" });
    }

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const amountInVND = Math.round(Number(amount));
    
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = language || "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    
    vnp_Params["vnp_OrderInfo"] = "Thanh toan don hang " + orderId; 
    vnp_Params["vnp_OrderType"] = "billpayment"; 
    
    vnp_Params["vnp_Amount"] = amountInVND * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    
    vnp_Params["vnp_SecureHash"] = signed;
    let paymentUrl = vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });

    return res.status(200).json({ success: true, paymentUrl: paymentUrl });
  } catch (error) {
    console.error("Error create_payment_url:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// 2. VNPAY RETURN
router.get("/vnpay_return", async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
        const orderId = vnp_Params["vnp_TxnRef"];
        const responseCode = vnp_Params["vnp_ResponseCode"];
        
        if (responseCode === "00") {
            console.log(" VNPay Return: Success for Order", orderId);

            // Cập nhật DB
            const updatedOrder = await Order.findByIdAndUpdate(orderId, {
                status: 'Waiting_Approval', 
                isPaid: true,
                paymentMethod: 'VNPay',
                paidAt: new Date()
            }, { new: true })
            .populate("user", "email name");

            // GỬI EMAIL
            if (updatedOrder) {
                sendOrderEmail(updatedOrder, "Waiting_Approval").catch(err => 
                    console.error("Send mail failed:", err.message)
                );
            }

            return res.redirect(`http://localhost:3000/checkout/success?orderId=${orderId}`);
        } else {
            console.log(" VNPay Return: Failed for Order", orderId);
            return res.redirect(`http://localhost:3000/checkout/error`);
        }
    } else {
        return res.redirect(`http://localhost:3000/checkout/error?msg=ChecksumFailed`);
    }
  } catch (error) {
      console.error("Lỗi xử lý vnpay_return:", error);
      return res.redirect(`http://localhost:3000/checkout/error?msg=ServerErr`);
  }
});

// 3. VNPAY IPN
router.get("/vnpay_ipn", async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];
    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
        const order = await Order.findById(orderId);
        if (!order) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        
        if (order.status === 'Waiting_Approval' || order.status === 'Processing' || order.isPaid) {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (rspCode === "00") {
            const updatedOrder = await Order.findByIdAndUpdate(orderId, {
                status: 'Waiting_Approval',
                isPaid: true,
                paymentMethod: 'VNPay',
                paidAt: new Date()
            }, { new: true })
            .populate("user", "email name");

            console.log(" IPN: Updated Order Success:", orderId);

            if (updatedOrder) {
                sendOrderEmail(updatedOrder, "Waiting_Approval").catch(err => 
                     console.error("IPN Send mail failed:", err.message)
                );
            }

            return res.status(200).json({ RspCode: "00", Message: "Success" });
        } else {
            console.log(" IPN: Updated Order Failed:", orderId);
            return res.status(200).json({ RspCode: "00", Message: "Success" });
        }
    } else {
        return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    }
  } catch (error) {
     console.error("IPN Error:", error);
     return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;