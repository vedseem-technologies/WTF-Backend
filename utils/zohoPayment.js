import axios from 'axios';
import { getAccessToken, invalidateToken } from '../services/zohoAuth.js';

const ZOHO_API_URL = process.env.ZOHO_PAYMENT_API_URL || 'https://payments.zoho.in/api/v1';

/**
 * Create a Zoho Payment Link for an order.
 * Calls Zoho Payments API v1 to generate a hosted payment page
 * supporting UPI, Credit Cards, Netbanking, Wallets.
 */
export const createZohoPaymentLink = async (orderData) => {
  try {
    const accessToken = await getAccessToken();

    const payload = {
      amount: orderData.totalAmount || 0,
      currency: 'INR',
      description: `Order #${orderData.orderId} - WTF Foods Catering`.substring(0, 200),
      reference_id: orderData.orderId,
      email: orderData.userId?.email || orderData.bookingDetails?.email || '',
      phone: orderData.userId?.phone || orderData.bookingDetails?.phone || '',
      return_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/order-success?id=${orderData.orderId}&status=success`,
    };

    const response = await axios.post(`${ZOHO_API_URL}/payment_links`, payload, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;

    if (data && data.payment_link_id) {
      return {
        success: true,
        payment_link: data.url,
        transaction_id: data.payment_link_id
      };
    }

    throw new Error('Invalid response from Zoho: missing payment_link_id');

  } catch (error) {
    // If 401 (token expired), invalidate and retry once
    if (error.response?.status === 401) {
      invalidateToken();

      try {
        const freshToken = await getAccessToken();

        const retryPayload = {
          amount: orderData.totalAmount || 0,
          currency: 'INR',
          description: `Order #${orderData.orderId} - WTF Foods Catering`.substring(0, 200),
          reference_id: orderData.orderId,
          email: orderData.userId?.email || orderData.bookingDetails?.email || '',
          phone: orderData.userId?.phone || orderData.bookingDetails?.phone || '',
          return_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/order-success?id=${orderData.orderId}&status=success`,
        };

        const retryResponse = await axios.post(`${ZOHO_API_URL}/payment_links`, retryPayload, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${freshToken}`,
            'Content-Type': 'application/json'
          }
        });

        const retryData = retryResponse.data;
        if (retryData && retryData.payment_link_id) {
          return {
            success: true,
            payment_link: retryData.url,
            transaction_id: retryData.payment_link_id
          };
        }
      } catch (retryError) {
        console.error('Zoho Payment retry failed:', retryError.response?.data || retryError.message);
      }
    }

    console.error('Zoho Payment API Error:', error.response?.data || error.message);
    throw new Error(`Payment link creation failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Verify a payment status from Zoho API
 */
export const verifyZohoPayment = async (paymentLinkId) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(`${ZOHO_API_URL}/payment_links/${paymentLinkId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    return {
      status: data.status || 'unknown',
      amount_paid: data.amount_paid,
      verified: true
    };

  } catch (error) {
    console.error('Zoho Payment Verification Error:', error.response?.data || error.message);
    return { status: 'failed', verified: false };
  }
};
