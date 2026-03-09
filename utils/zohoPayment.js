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
    if (!process.env.ZOHO_ACCOUNT_ID) {
      throw new Error('ZOHO_ACCOUNT_ID missing in .env — find it at Zoho Payments → Settings → Developer Space');
    }

    const accessToken = await getAccessToken();

    const payload = {
      amount: orderData.totalAmount || 0,
      currency: 'INR',
      description: `WTF Foods Catering - Order #${orderData.orderId}`.substring(0, 200),
      // reference_id: orderData.orderId,
      // customer: {
      //   email: orderData.userId?.email || orderData.bookingDetails?.email || '',
      //   phone: orderData.userId?.phone || orderData.bookingDetails?.phone || '',
      // },
      // redirect_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/order-success?id=${orderData.orderId}&status=success`,
    };

    console.log('Zoho Payment Request URL:', `${ZOHO_API_URL}/paymentlinks?account_id=${process.env.ZOHO_ACCOUNT_ID}`);
    console.log('Zoho Payment Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${ZOHO_API_URL}/paymentlinks?account_id=${process.env.ZOHO_ACCOUNT_ID}`,
      payload,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Zoho Payment Response:', JSON.stringify(response.data, null, 2));

    const data = response.data;

    // Handle Zoho's response format (may be nested under payment_link or paymentlink or payment_links)
    const linkData = data.payment_links || data.payment_link || data.paymentlink || data;

    if (linkData && (linkData.payment_link_id || linkData.paymentlink_id)) {
      return {
        success: true,
        payment_link: linkData.payment_link_url || linkData.url || linkData.link_url,
        transaction_id: linkData.payment_link_id || linkData.paymentlink_id
      };
    }

    console.error('Unexpected Zoho response format:', JSON.stringify(data, null, 2));
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
          description: `WTF Foods Catering - Order #${orderData.orderId}`.substring(0, 200),
          // reference_id: orderData.orderId,
          // customer: {
          //   email: orderData.userId?.email || orderData.bookingDetails?.email || '',
          //   phone: orderData.userId?.phone || orderData.bookingDetails?.phone || '',
          // },
          // redirect_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/order-success?id=${orderData.orderId}&status=success`,
        };

        const retryResponse = await axios.post(
          `${ZOHO_API_URL}/paymentlinks?account_id=${process.env.ZOHO_ACCOUNT_ID}`,
          retryPayload,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${freshToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const retryData = retryResponse.data;
        const retryLinkData = retryData.payment_links || retryData.payment_link || retryData.paymentlink || retryData;

        if (retryLinkData && (retryLinkData.payment_link_id || retryLinkData.paymentlink_id)) {
          return {
            success: true,
            payment_link: retryLinkData.payment_link_url || retryLinkData.url || retryLinkData.link_url,
            transaction_id: retryLinkData.payment_link_id || retryLinkData.paymentlink_id
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

    const response = await axios.get(
      `${ZOHO_API_URL}/paymentlinks/${paymentLinkId}?account_id=${process.env.ZOHO_ACCOUNT_ID}`,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;
    const linkData = data.payment_links || data.payment_link || data.paymentlink || data;
    return {
      status: linkData.status || 'unknown',
      amount_paid: linkData.amount_paid,
      verified: true
    };

  } catch (error) {
    // If 401 (token expired), invalidate and retry once
    if (error.response?.status === 401) {
      console.log('Zoho verification token expired, retrying...');
      invalidateToken();

      try {
        const freshToken = await getAccessToken();
        const retryResponse = await axios.get(
          `${ZOHO_API_URL}/paymentlinks/${paymentLinkId}?account_id=${process.env.ZOHO_ACCOUNT_ID}`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${freshToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const retryData = retryResponse.data;
        const retryLinkData = retryData.payment_links || retryData.payment_link || retryData.paymentlink || retryData;
        return {
          status: retryLinkData.status || 'unknown',
          amount_paid: retryLinkData.amount_paid,
          verified: true
        };
      } catch (retryError) {
        console.error('Zoho Payment Verification retry failed:', retryError.response?.data || retryError.message);
      }
    }

    console.error('Zoho Payment Verification Error:', error.response?.data || error.message);
    return { status: 'failed', verified: false };
  }
};
