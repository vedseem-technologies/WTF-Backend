import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Order from './models/order.model.js';
import { createZohoPaymentLink } from './utils/zohoPayment.js';

async function testPaymentFlow() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    // Create a mock order object structure required by createZohoPaymentLink
    const mockOrder = {
      orderId: "WTF-" + Date.now(),
      totalAmount: 100, // 100 INR
      userId: {
        email: "test@example.com",
        phone: "9999999999"
      }
    };

    console.log("Initiating Zoho Payment Link for mock order:", mockOrder.orderId);
    const result = await createZohoPaymentLink(mockOrder);

    console.log("\n✅ SUCCESS: Payment Link Generated!");
    console.log("------------------------------------------");
    console.log("Payment Link URL:", result.payment_link);
    console.log("Transaction ID:", result.transaction_id);
    console.log("------------------------------------------");

  } catch (e) {
    console.error("\n❌ FAILED to create payment link:");
    console.error(e.message || e);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

testPaymentFlow();
