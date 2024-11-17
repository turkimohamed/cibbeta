async function handlePaymentRequest(orderId, amount) {
    try {
        // Call your backend to create the payment link
        const response = await fetch('https://trendybuyme.com/create-payment-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderNumber: orderId,
                amount: amount,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create payment link');
        }

        const data = await response.json();
        const paymentLink = data.paymentLink;

        if (paymentLink) {
            // Redirect to the payment link
            window.location.href = paymentLink;
        } else {
            alert('Error: Payment link not generated');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Payment link generation failed');
    }
}

// Example usage (could be triggered by some event like a button click)
const orderId = '6226655478074';  // Replace with the actual order ID
const amount = 250000;  // Replace with the actual amount
handlePaymentRequest(orderId, amount);
