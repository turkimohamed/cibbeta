import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات SATIM وShopify
const MERCHANT_USERNAME = process.env.MERCHANT_USERNAME;
const MERCHANT_PASSWORD = process.env.MERCHANT_PASSWORD;
const TERMINAL_ID = process.env.TERMINAL_ID;
const CURRENT_URL = process.env.CURRENT_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME;
const SHOPIFY_SECRET = process.env.SHOPIFY_SECRET;

app.use(cors());
app.use(express.json());

// معالجة Webhook الخاص بـ Shopify
app.post('/shopify-webhook', express.json(), async (req, res) => {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    const shopifyTopic = req.get('X-Shopify-Topic');
    const shopifyDomain = req.get('X-Shopify-Shop-Domain');

    // التحقق من التوقيع
    const body = JSON.stringify(req.body);
    const crypto = await import('crypto');
    const generatedHmac = crypto.createHmac('sha256', SHOPIFY_SECRET).update(body, 'utf8').digest('base64');

    if (generatedHmac !== hmacHeader) {
        console.error('Webhook verification failed!');
        return res.status(401).send('Unauthorized');
    }

    console.log(`Received Webhook from ${shopifyDomain}`);
    console.log(`Event: ${shopifyTopic}`);
    console.log('Payload:', req.body);

    // معالجة البيانات
    if (shopifyTopic === 'orders/create') {
        const orderData = req.body;
        console.log('Order Created:', orderData);
        // تنفيذ أي معالجة إضافية للطلب...
    }

    res.status(200).send('Webhook received');
});

// إنشاء رابط الدفع مع SATIM
app.get('/payment', async (req, res) => {
    const { price, orderId } = req.query;

    if (!price || isNaN(price)) {
        return res.status(400).send('Invalid price');
    }

    const amount = price * 100; // تحويل السعر إلى أصغر وحدة
    const paymentUrl = new URL("https://test.satim.dz/payment/rest/register.do");
    paymentUrl.searchParams.append("userName", MERCHANT_USERNAME);
    paymentUrl.searchParams.append("password", MERCHANT_PASSWORD);
    paymentUrl.searchParams.append("orderNumber", orderId || Date.now().toString());
    paymentUrl.searchParams.append("amount", amount);
    paymentUrl.searchParams.append("returnUrl", `${CURRENT_URL}/success`);
    paymentUrl.searchParams.append("failUrl", `${CURRENT_URL}/failure`);

    try {
        const response = await fetch(paymentUrl.toString(), { method: 'GET' });
        const data = await response.json();

        if (data.errorCode) {
            return res.status(400).send(`SATIM Error: ${data.errorMessage}`);
        }

        res.send({ paymentLink: data.formUrl });
    } catch (error) {
        console.error('Error creating payment link:', error);
        res.status(500).send('Internal server error');
    }
});

// نجاح الدفع
app.get('/success', async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).send('Order ID is required');
    }

    const confirmUrl = new URL("https://test.satim.dz/payment/rest/getOrderStatus.do");
    confirmUrl.searchParams.append("userName", MERCHANT_USERNAME);
    confirmUrl.searchParams.append("password", MERCHANT_PASSWORD);
    confirmUrl.searchParams.append("orderId", orderId);

    try {
        const response = await fetch(confirmUrl.toString(), { method: 'GET' });
        const data = await response.json();

        if (data.orderStatus === '2') {
            await updateShopifyOrder(orderId);
            res.send('Payment successful and order updated in Shopify!');
        } else {
            res.status(400).send('Payment verification failed!');
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).send('Internal server error');
    }
});

// فشل الدفع
app.get('/failure', (req, res) => {
    res.send('Payment failed!');
});

// تحديث حالة الطلب في Shopify
async function updateShopifyOrder(orderId) {
    const shopifyUrl = `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2023-10/orders/${orderId}.json`;

    try {
        const response = await fetch(shopifyUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            },
            body: JSON.stringify({
                order: {
                    id: orderId,
                    financial_status: 'paid',
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update Shopify order: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Shopify order updated:', data);
    } catch (error) {
        console.error('Error updating Shopify order:', error);
        throw error;
    }
}

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
