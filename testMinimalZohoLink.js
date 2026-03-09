import axios from 'axios';
import { getAccessToken } from './services/zohoAuth.js';
import dotenv from 'dotenv';

dotenv.config();

const ZOHO_API_URL = process.env.ZOHO_PAYMENT_API_URL || 'https://payments.zoho.in/api/v1';

async function testMinimalLink() {
  try {
    console.log("Fetching token...");
    const token = await getAccessToken();
    console.log("Token obtained.");

    const payload = {
      amount: 100.00,
      currency: "INR",
      description: "Test Checkout"
    };

    console.log("Sending payload:", payload);

    const response = await axios.post(
      `${ZOHO_API_URL}/paymentlinks?account_id=${process.env.ZOHO_ACCOUNT_ID}`,
      payload,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Success! Link:", response.data);
  } catch (e) {
    console.log("Failed:", e.response?.data || e.message);
  }
}

testMinimalLink();
