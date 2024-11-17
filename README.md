Here’s the updated README.md file with your name as the author:

# SATIM Payment Gateway Integration

This project is a Node.js server that integrates the SATIM payment gateway. It provides endpoints for generating payment links, handling payment success, and managing payment failures. The server is designed to work with platforms like Shopify and can be customized for other e-commerce systems.

## Features

- Generate SATIM payment links dynamically based on the price.
- Handle payment success and failure callbacks.
- Easily configurable via environment variables.
- Secure and scalable server setup with Express.js.

## Prerequisites

Before running the project, ensure the following:

1. **Node.js** is installed (v14 or later recommended).
2. **npm** is available to install dependencies.
3. A **SATIM merchant account** with the following credentials:
   - Username
   - Password
   - Terminal ID
4. A valid **return URL** and **failure URL**.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/satim-integration.git
   cd satim-integration

	2.	Install dependencies:

npm install


	3.	Create a .env file in the root directory and configure it:

MERCHANT_USERNAME=your-satim-username
MERCHANT_PASSWORD=your-satim-password
TERMINAL_ID=your-terminal-id
CURRENT_URL=https://your-domain.com
PORT=3000


	4.	Run the server:

node index.js



API Endpoints

1. Generate Payment Link

Endpoint: /payment
Method: GET
Query Parameters:
	•	price (required): Price of the order.
	•	orderNumber (optional): Custom order number. A random one will be generated if not provided.

Example Request:

curl "http://localhost:3000/payment?price=100&orderNumber=12345"

Response:

<b>Payment Link:</b> <br> <a href="https://test.satim.dz/payment/..." target="_blank">https://test.satim.dz/payment/...</a>

2. Payment Success Callback

Endpoint: /success
Method: GET
Query Parameters:
	•	orderId (required): SATIM order ID.

Example Request:

curl "http://localhost:3000/success?orderId=abc123"

Response:

{
  "status": "success",
  "orderId": "abc123",
  "message": "Payment successful"
}

3. Payment Failure Callback

Endpoint: /failure
Method: GET
Query Parameters:
	•	orderId (required): SATIM order ID.

Example Request:

curl "http://localhost:3000/failure?orderId=abc123"

Response:

{
  "status": "failure",
  "orderId": "abc123",
  "message": "Payment failed"
}

Environment Variables

Variable	Description	Example
MERCHANT_USERNAME	Your SATIM merchant username	merchant123
MERCHANT_PASSWORD	Your SATIM merchant password	password123
TERMINAL_ID	Your SATIM terminal ID	123456
CURRENT_URL	Public URL for your server	https://yourdomain.com
PORT	Port number for the server	3000

Dependencies

The project uses the following npm packages:
	•	express
	•	dotenv
	•	node-fetch
	•	cors

Install them using:

npm install

Deployment

	1.	Deploy the project to a cloud service like Heroku, Render, or AWS.
	2.	Configure the environment variables in the deployment platform.
	3.	Update your SATIM account with the returnUrl and failUrl pointing to the deployed server.

Author

Created by Turki Mohamed.

License

This project is licensed under the MIT License. See the LICENSE file for details.

For any issues or contributions, feel free to open a ticket or submit a pull request.

Feel free to replace placeholders like `your-repo` or `your-domain` with your actual project details!
