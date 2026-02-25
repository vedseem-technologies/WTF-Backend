import axios from 'axios';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get a valid Zoho OAuth access_token.
 * Uses refresh_token to generate a new access_token when expired.
 * Caches token in memory with 50-minute TTL (tokens valid for 1 hour).
 */
export const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Zoho OAuth credentials missing. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN in .env'
    );
  }

  try {
    const response = await axios.post(
      `${accountsUrl}/oauth/v2/token`,
      null,
      {
        params: {
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error(response.data.error || 'Failed to get access token from Zoho');
    }

    cachedToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in ? (expires_in - 600) * 1000 : 50 * 60 * 1000);

    return access_token;

  } catch (error) {
    cachedToken = null;
    tokenExpiresAt = 0;

    const errMsg = error.response?.data?.error || error.message;
    console.error('Zoho OAuth Token Refresh Error:', errMsg);
    throw new Error(`Zoho OAuth failed: ${errMsg}`);
  }
};

/**
 * Invalidate the cached token (used when API returns 401)
 */
export const invalidateToken = () => {
  cachedToken = null;
  tokenExpiresAt = 0;
};
