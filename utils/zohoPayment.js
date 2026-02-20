import axios from 'axios';

// ============ CONFIG ============
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID;
const ZOHO_API_URL = process.env.ZOHO_PAYMENT_API_URL || 'https://payments.zoho.in/api/v1';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ============ TOKEN CACHE ============
let cachedAccessToken = null;
let tokenExpiryTime = 0;

/**
 * Get a valid Zoho OAuth Access Token.
 * Strategy:
 *   1. If REFRESH_TOKEN exists → use refresh_token grant (preferred)
 *   2. Else → use client_credentials grant
 *   3. Token is cached in memory until 5 min before expiry
 */
const getAccessToken = async () => {
  if (cachedAccessToken && Date.now() < tokenExpiryTime - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
    throw new Error('ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET are required');
  }

  let params;
  if (ZOHO_REFRESH_TOKEN && !ZOHO_REFRESH_TOKEN.startsWith('YOUR_')) {
    params = {
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    };
  } else {
    params = {
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'ZohoPayments.fullaccess.ALL'
    };
  }

  try {
    console.log(`🔄 Zoho Auth: ${params.grant_type} grant...`);
    const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, { params });

    if (response.data?.access_token) {
      cachedAccessToken = response.data.access_token;
      tokenExpiryTime = Date.now() + (response.data.expires_in || 3600) * 1000;
      console.log('✅ Zoho Access Token obtained');
      return cachedAccessToken;
    }

    throw new Error(response.data?.error || 'No access_token in response');
  } catch (error) {
    console.error('❌ Zoho Token Error:', error.response?.data || error.message);
    throw new Error('Failed to get Zoho access token: ' + (error.response?.data?.error || error.message));
  }
};

/**
 * Check if Zoho credentials are properly configured.
 */
const hasZohoCredentials = () => {
  return ZOHO_CLIENT_ID
    && ZOHO_CLIENT_SECRET
    && !ZOHO_CLIENT_ID.startsWith('YOUR_')
    && !ZOHO_CLIENT_SECRET.startsWith('YOUR_');
};

/**
 * Build authorization headers for Zoho API calls.
 */
const getZohoHeaders = (accessToken) => {
  const headers = {
    'Authorization': `Zoho-oauthtoken ${accessToken}`,
    'Content-Type': 'application/json'
  };
  if (ZOHO_ORG_ID && !ZOHO_ORG_ID.startsWith('YOUR_')) {
    headers['X-com-zoho-payment-organizationid'] = ZOHO_ORG_ID;
  }
  return headers;
};

// ============ CREATE PAYMENT LINK ============
export const createZohoPaymentLink = async (orderData) => {
  // PRODUCTION: Zoho credentials are mandatory
  if (!hasZohoCredentials()) {
    if (IS_PRODUCTION) {
      throw new Error('Zoho Payment credentials not configured. Cannot process payments.');
    }
    console.warn("⚠️ [DEV] Zoho credentials missing → returning mock link");
    return getMockResponse(orderData);
  }

  try {
    const accessToken = await getAccessToken();

    const payload = {
      reference_id: orderData.orderId,
      amount: orderData.totalAmount || 0,
      currency_code: "INR",
      description: `Order #${orderData.orderId} - ${orderData.bookingDetails?.date || ''} ${orderData.bookingDetails?.time || ''} - ${orderData.address || ''}`.substring(0, 200),
      customer: {
        name: orderData.userId?.firstName || orderData.bookingDetails?.name || 'Customer',
        email: orderData.userId?.email || orderData.bookingDetails?.email,
        phone: orderData.userId?.phone || orderData.bookingDetails?.phone
      },
      return_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/order-success?id=${orderData.orderId}`,
      notify_url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/payment/verify`,
      payment_methods: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: true
      }
    };

    console.log(`💳 Creating Zoho Payment Link for order ${orderData.orderId}...`);

    const response = await axios.post(`${ZOHO_API_URL}/payment_links`, payload, {
      headers: getZohoHeaders(accessToken)
    });

    if (response.data?.payment_link) {
      console.log(`✅ Payment Link created: ${orderData.orderId}`);
      return {
        success: true,
        payment_link: response.data.payment_link,
        transaction_id: response.data.payment_link_id || orderData.orderId
      };
    }

    throw new Error('Zoho API did not return a payment_link');

  } catch (error) {
    console.error('❌ Zoho Payment Error:', error.response?.data || error.message);

    // In production, never fall back to mock — throw the error
    if (IS_PRODUCTION) {
      throw new Error('Payment gateway error: ' + (error.response?.data?.message || error.message));
    }

    // Development only: fall back to mock
    console.warn('⚠️ [DEV] Falling back to mock payment link');
    return getMockResponse(orderData);
  }
};

// ============ VERIFY PAYMENT ============
export const verifyZohoPayment = async (paymentId) => {
  if (!hasZohoCredentials()) {
    if (IS_PRODUCTION) {
      throw new Error('Cannot verify payment: Zoho credentials not configured');
    }
    return { status: 'confirmed' };
  }

  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(`${ZOHO_API_URL}/payments/${paymentId}`, {
      headers: getZohoHeaders(accessToken)
    });

    if (response.data?.payment) {
      const payment = response.data.payment;
      console.log(`✅ Payment ${paymentId} verified: ${payment.status}`);
      return {
        status: payment.status,
        amount: payment.amount,
        payment_mode: payment.payment_mode,
        raw: payment
      };
    }

    return { status: 'unknown' };
  } catch (error) {
    console.error('❌ Verify Error:', error.response?.data || error.message);
    return { status: 'failed', error: error.message };
  }
};

// ============ MOCK (Development Only) ============
const getMockResponse = (orderData) => {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
  return {
    success: true,
    payment_link: `${websiteUrl}/order-success?id=${orderData.orderId}&mock_payment=true`,
    transaction_id: `MOCK-${Date.now()}`
  };
};
