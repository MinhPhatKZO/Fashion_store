const express = require('express');
const crypto = require('crypto');
const https = require('https');

const router = express.Router();

/* =============================================
   CHECK ENV
============================================= */
if (!process.env.MOMO_PARTNER_CODE ||
    !process.env.MOMO_ACCESS_KEY ||
    !process.env.MOMO_SECRET_KEY ||
    !process.env.MOMO_REDIRECT_URL ||
    !process.env.MOMO_IPN_URL) 
{
    console.log("MoMo config missing! Required variables:");
    console.log("   - MOMO_PARTNER_CODE");
    console.log("   - MOMO_ACCESS_KEY");
    console.log("   - MOMO_SECRET_KEY");
    console.log("   - MOMO_REDIRECT_URL");
    console.log("   - MOMO_IPN_URL");
}

// tạo payment request đến MoMo
router.post('/payment', async (req, res) => {
    try {
        const { amount, orderInfo } = req.body;

        if (!amount || !orderInfo) {
            return res.status(400).json({ message: "Missing amount or orderInfo" });
        }

        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;

        const redirectUrl = process.env.MOMO_REDIRECT_URL;
        const ipnUrl = process.env.MOMO_IPN_URL;

        const requestId = `${partnerCode}${Date.now()}`;
        const orderId = requestId;
        const requestType = "captureWallet";
        const extraData = "";

        // Tạo signature theo MoMo
        const rawSignature =
            `accessKey=${accessKey}` +
            `&amount=${amount}` +
            `&extraData=${extraData}` +
            `&ipnUrl=${ipnUrl}` +
            `&orderId=${orderId}` +
            `&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}` +
            `&redirectUrl=${redirectUrl}` +
            `&requestId=${requestId}` +
            `&requestType=${requestType}`;

        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // Body gửi lên MoMo
        const requestBody = JSON.stringify({
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: 'vi'
        });

        // Gửi request đến MoMo
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

            momoRes.on('data', chunk => (data += chunk)); // trả về https chia nhỏ chunks
            momoRes.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    return res.json(json);
                } catch (err) {
                    return res.status(500).json({
                        message: "Invalid JSON returned from MoMo",
                        rawData: data
                    });
                }
            });
        });

        momoReq.on('error', e => {
            console.error("MoMo request error:", e);
            res.status(500).json({
                message: 'MoMo request failed',
                error: e.message
            });
        });

        momoReq.write(requestBody);
        momoReq.end();

    } catch (error) {
        console.error("MoMo server error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
