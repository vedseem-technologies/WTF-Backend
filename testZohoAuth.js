import { getAccessToken } from './services/zohoAuth.js';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
    try {
        console.log("Testing Zoho Auth...");
        const token = await getAccessToken();
        console.log("Success! Access token:", token.substring(0, 15) + "...");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

test();
