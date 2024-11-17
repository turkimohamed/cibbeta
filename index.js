const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Set up environment variables for SATIM
const SATIM_API_URL = 'https://test.satim.dz/payment/rest/register.do';
const SATIM_USERNAME = 'SAT241027-2147483562';
const SATIM_PASSWORD = 'satim120';
const TERMINAL_ID = 'E010901319';
const RETURN_URL = 'https://trendybuyme.com/order/success';
const FAIL_URL = 'https://trendybuyme.com/order/fail';
const LANGUAGE = 'FR';

app.use(cors());  // Enable CORS
app.use(bodyParser.json());  // Parse JSON requests

// Endpoint to create payment link from SATIM API
app.post('/create-payment-link', async (req, res) => {
    const { orderNumber, amount } = req.body;

    // Prepare SATIM API request parameters
    const params = new URLSearchParams({
        userName: SATIM_USERNAME,
        password: SATIM_PASSWORD,
        orderNumber,
        amount,
        currency: '012', // Currency code (Algerian Dinar)
        returnUrl: RETURN_URL,
        failUrl: FAIL_URL,
        language: LANGUAGE,
        jsonParams: JSON.stringify({ force_terminal_id: TERMINAL_ID }),
    });

    try {
        // Make request to SATIM API
        const response = await fetch(SATIM_API_URL + '?' + params.toString(), {
            method: 'GET',
        });

        const data = await response.json();

        if (data.errorCode === 0) {
            // Successfully created payment link
            res.status(200).json({ paymentLink: data.formUrl });
        } else {
            // Handle SATIM API error
            console.error('SATIM Error:', data.errorMessage);
            res.status(500).json({ error: data.errorMessage });
        }
    } catch (error) {
        // Handle network or other errors
        console.error('Error in SATIM request:', error);
        res.status(500).json({ error: 'Failed to create payment link' });
    }
});

// Run the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
