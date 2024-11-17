import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/payment', async (req, res) => {
    const { price } = req.query;
    const orderNumber = req.query.orderNumber || Math.floor(Math.random() * 100000).toString();

    if (!price) {
        return res.status(400).send('Error: price query parameter is required');
    }

    if (!isNumeric(price)) {
        return res.status(400).send('Error: Price query parameter is not a valid number');
    }

    if (price < 50) {
        return res.status(400).send('Error: the minimum price is 50');
    }

    try {
        const paymentUrl = getRegisterUrl(price, orderNumber).toString();
        const response = await fetch(paymentUrl, { method: 'GET' });
        const data = await response.json();

        if (data.errorCode) {
            return res.status(400).send(`SATIM Error: ${data.errorMessage}`);
        }

        res.send(`<b>Payment Link:</b> <br> <a href="${data.formUrl}" target="_blank">${data.formUrl}</a>`);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong!');
    }
});

app.get('/success', async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).send('Error: orderId query parameter is required');
    }

    try {
        const confirmUrl = getConfirmationUrl(orderId).toString();
        const response = await fetch(confirmUrl, { method: 'GET' });
        const data = await response.json();

        res.send(`<b>Success Data:</b> <br> ${JSON.stringify(data)}`);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong!');
    }
});

app.get('/failure', async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).send('Error: orderId query parameter is required');
    }

    try {
        const confirmUrl = getConfirmationUrl(orderId).toString();
        const response = await fetch(confirmUrl, { method: 'GET' });
        const data = await response.json();

        res.send(`<b>Payment Failed:</b> <br> ${JSON.stringify(data)}`);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Something went wrong!');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Helper Functions
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function getRegisterUrl(price, orderNumber) {
    const registerUrl = "https://test.satim.dz/payment/rest/register.do";
    const merchant_username = process.env.MERCHANT_USERNAME;
    const merchant_password = process.env.MERCHANT_PASSWORD;
    const terminal_id = process.env.TERMINAL_ID;
    const currency = "012";
    const amount = price * 100; // SATIM يقبل العملات في الوحدة الأصغر
    const language = "fr";
    const returnUrl = `${process.env.CURRENT_URL}/success`;
    const failUrl = `${process.env.CURRENT_URL}/failure`;
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