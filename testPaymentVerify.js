import dotenv from 'dotenv';
import { verifyZohoPayment } from './utils/zohoPayment.js';

dotenv.config();

async function testVerification() {
  try {
    const paymentLinkId = "6355000000120007"; // ID from our successful creation test
    console.log("Verifying payment link:", paymentLinkId);

    const result = await verifyZohoPayment(paymentLinkId);

    console.log("\n✅ Verification Result:");
    console.log(result);
  } catch (e) {
    console.error("\n❌ FAILED to verify:");
    console.error(e.message || e);
  }
}

testVerification();
