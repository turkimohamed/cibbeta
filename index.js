import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fetch from 'node-fetch';

// تحميل متغيرات البيئة
dotenv.config();

// إعداد التطبيق
const app = express();
const port = process.env.PORT || 10000;

// التعامل مع طلبات JSON
app.use(express.json());

// التحقق من Webhooks الواردة من Shopify
app.post('/shopify-webhook', async (req, res) => {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    const shopifyTopic = req.get('X-Shopify-Topic');
    const shopifyDomain = req.get('X-Shopify-Shop-Domain');
    const secret = process.env.SHOPIFY_SECRET;

    const body = JSON.stringify(req.body);
    const generatedHmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

    // تحقق من صحة Webhook
    if (generatedHmac !== hmacHeader) {
        console.error('Webhook verification failed!');
        return res.status(401).send('Unauthorized');
    }

    console.log(`Received Webhook from ${shopifyDomain}`);
    console.log(`Event: ${shopifyTopic}`);
    console.log('Payload:', req.body);

    // التعامل مع الأحداث
    if (shopifyTopic === 'orders/create') {
        const orderData = req.body;

        // إرسال الطلب إلى SATIM لتوليد رابط الدفع
        const price = orderData.total_price || 0;
        const orderNumber = orderData.id;

        if (price > 0) {
            try {
                const paymentUrl = getRegisterUrl(price, orderNumber).toString();
                const response = await fetch(paymentUrl, { method: 'GET' });
                const data = await response.json();

                if (data.errorCode) {
                    console.error('SATIM Error:', data.errorMessage);
                } else {
                    console.log('Payment link created:', data.formUrl);
                }
            } catch (error) {
                console.error('Error creating payment link:', error);
            }
        }
    }

    res.status(200).send('Webhook received');
});

// مسار نجاح الدفع
app.get('/success', async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).send('Error: orderId query parameter is required');
    }

    try {
        const confirmUrl = getConfirmationUrl(orderId).toString();
        const response = await fetch(confirmUrl, { method: 'GET' });
        const data = await response.json();

        console.log('Payment Success Data:', data);

        // تحديث الطلب في Shopify
        await updateOrderStatus(orderId);
        res.send('Payment success!');
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong!');
    }
});

// مسار فشل الدفع
app.get('/failure', (req, res) => {
    console.error('Payment failed for order:', req.query.orderId);
    res.status(200).send('Payment failed');
});

// بدء الخادم
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Helper Functions

function getRegisterUrl(price, orderNumber) {
    const registerUrl = "https://test.satim.dz/payment/rest/register.do";
    const merchant_username = process.env.MERCHANT_USERNAME;
    const merchant_password = process.env.MERCHANT_PASSWORD;
    const terminal_id = process.env.TERMINAL_ID;
    const currency = "012";
    const amount = price * 100; // SATIM يتطلب العملات في الوحدة الأصغر
    const language = "fr";
    const returnUrl = `${process.env.HOST_URL}/success`;
    const failUrl = `${process.env.HOST_URL}/failure`;
    const jsonParams = JSON.stringify({
        force_terminal_id: terminal_id,
        udf1: orderNumber,
    });

    const url = new URL(registerUrl);
    url.searchParams.append("userName", merchant_username);
    url.searchParams.append("password", merchant_password);
    url.searchParams.append("currency", currency);
    url.searchParams.append("amount", amount);
    url.searchParams.append("language", language);
    url.searchParams.append("orderNumber", orderNumber);
    url.searchParams.append("returnUrl", returnUrl);
    url.searchParams.append("failUrl", failUrl);
    url.searchParams.append("jsonParams", jsonParams);

    return url;
}

function getConfirmationUrl(orderId) {
    const confirmUrl = "https://test.satim.dz/payment/rest/confirmOrder.do";
    const merchant_username = process.env.MERCHANT_USERNAME;
    const merchant_password = process.env.MERCHANT_PASSWORD;
    const language = "fr";

    const url = new URL(confirmUrl);
    url.searchParams.append("userName", merchant_username);
    url.searchParams.append("password", merchant_password);
    url.searchParams.append("orderId", orderId);
    url.searchParams.append("language", language);

    return url;
}

async function updateOrderStatus(orderId) {
    const shopifyUrl = `https://trendybuyme.com/admin/api/2023-10/orders/${orderId}.json`;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const response = await fetch(shopifyUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
            order: {
                id: orderId,
                financial_status: 'paid',
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update order: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Order updated in Shopify:', data);
}
