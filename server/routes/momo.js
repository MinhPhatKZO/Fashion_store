const express = require('express');
const crypto = require('crypto');
const https = require('https');
const Order = require('../models/Order'); // 👇 Import Order Model
const { sendOrderEmail } = require('../utils/emailService'); // 👇 Import Email Service

//  Load biến môi trường
require('dotenv').config();

const router = express.Router();

// --- CONFIG MOMO ---
const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const redirectUrl = process.env.MOMO_REDIRECT_URL;
const ipnUrl = process.env.MOMO_IPN_URL;

/* =============================================
   1. TẠO GIAO DỊCH THANH TOÁN
============================================= */
router.post('/payment', async (req, res) => {
    try {
        //  Nhận thêm orderId từ Frontend (Là _id của đơn hàng trong DB)
        const { amount, orderInfo, orderId: dbOrderId } = req.body;

        if (!amount || !orderInfo || !dbOrderId) {
            return res.status(400).json({ message: "Thiếu thông tin (amount, orderInfo, orderId)" });
        }

        const amountInNumber = Math.round(Number(amount));
        const requestId = `${partnerCode}${Date.now()}`;
        
        // Sử dụng ID đơn hàng từ DB để MoMo trả về, giúp ta dễ dàng update sau này
        const orderId = dbOrderId; 
        
        const requestType = "captureWallet";
        const extraData = ""; 

        // Tạo chữ ký
        const rawSignature =
            `accessKey=${accessKey}` +
            `&amount=${amountInNumber}` +
            `&extraData=${extraData}` +
            `&ipnUrl=${ipnUrl}` +
            `&orderId=${orderId}` +
            `&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}` +
            `&redirectUrl=${redirectUrl}` +
            `&requestId=${requestId}` +
            `&requestType=${requestType}`;

        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode, accessKey, requestId, amount: amountInNumber,
            orderId, orderInfo, redirectUrl, ipnUrl, extraData,
            requestType, signature, lang: 'vi'
        });

        // Gửi sang MoMo
        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const momoReq = https.request(options, momoRes => {
            let data = '';
            momoRes.on('data', chunk => (data += chunk));
            momoRes.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    return res.json(json);
                } catch (err) {
                    return res.status(500).json({ message: "MoMo Error", raw: data });
                }
            });
        });

        momoReq.on('error', e => res.status(500).json({ message: 'MoMo Request Failed', error: e.message }));
        momoReq.write(requestBody);
        momoReq.end();

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/* =============================================
   2. XỬ LÝ IPN (MoMo gọi về khi thanh toán xong)
   Cập nhật DB & Gửi Email tại đây
============================================= */
router.post('/ipn', async (req, res) => {
    try {
        const {
            partnerCode, orderId, requestId, amount, orderInfo, orderType, transId,
            resultCode, message, payType, responseTime, extraData, signature
        } = req.body;

        // 1. Xác thực chữ ký (Signature) để đảm bảo dữ liệu từ MoMo
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
            `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}` +
            `&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}` +
            `&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}` +
            `&transId=${transId}`;

        const generatedSignature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        if (signature !== generatedSignature) {
            return res.status(400).json({ message: "Invalid signature" });
        }

        // 2. Kiểm tra kết quả thanh toán (resultCode = 0 là thành công)
        if (resultCode == 0) {
            // THANH TOÁN THÀNH CÔNG
            
            // Tìm và cập nhật đơn hàng
            const updatedOrder = await Order.findByIdAndUpdate(orderId, {
                status: 'Waiting_Approval', // Chờ duyệt
                isPaid: true,
                paymentMethod: 'MoMo',
                paidAt: new Date()
            }, { new: true })
            .populate("user", "email name"); // Lấy email để gửi

            console.log("MoMo Success for Order:", orderId);

            // GỬI EMAIL THÔNG BÁO
            if (updatedOrder) {
                sendOrderEmail(updatedOrder, "Waiting_Approval").catch(err => 
                    console.error("MoMo IPN Send Mail Error:", err.message)
                );
            }
        } else {
            console.log(" MoMo Failed:", message);
            // Có thể cập nhật trạng thái đơn hàng là Failed nếu muốn
        }

        // Luôn trả về 204 hoặc 200 cho MoMo biết đã nhận tin
        return res.status(204).json({});

    } catch (error) {
        console.error("MoMo IPN Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;