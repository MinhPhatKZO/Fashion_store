const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// POST /api/momo/payment
router.post('/payment', async (req, res) => {
    try {
        const { amount, orderInfo } = req.body;

        // Thông số MoMo test
        const partnerCode = "MOMO";
        const accessKey = "F8BBA842ECF85";
        const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
        const requestId = partnerCode + new Date().getTime();
        const orderId = requestId;
        const redirectUrl = "https://momo.vn/return";
        const ipnUrl = "https://callback.url/notify";
        const requestType = "captureWallet";
        const extraData = "";

        // Tạo signature
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey)
                                .update(rawSignature)
                                .digest('hex');

        // Body gửi MoMo
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
            lang: 'en'
        });

        // Gửi request tới MoMo
        const https = require('https');
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

        const reqMomo = https.request(options, response => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                res.json(JSON.parse(data)); // trả JSON MoMo về client
            });
        });

        reqMomo.on('error', (e) => {
            console.error(e);
            res.status(500).json({ message: 'MoMo request failed', error: e.message });
        });

        reqMomo.write(requestBody);
        reqMomo.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;