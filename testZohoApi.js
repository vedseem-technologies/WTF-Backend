import axios from 'axios';
import { getAccessToken } from './services/zohoAuth.js';
import dotenv from 'dotenv';
dotenv.config();

async function testOrganizationsEndpoint() {
  try {
    const token = await getAccessToken();

    // Try getting user profile or merchants
    const response = await axios.get('https://payments.zoho.in/api/v1/merchants', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`
      }
    });
    console.log("Success Merchants:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error fetching merchants:", error.response?.data || error.message);
  }
}

testOrganizationsEndpoint();
