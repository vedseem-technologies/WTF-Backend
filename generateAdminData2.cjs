require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function generateMongoData() {
  const email = process.env.Admin_Email || "admin@example.com";
  const password = process.env.Admin_Pass || "Admin123!";

  const hashedPassword = await bcrypt.hash(password, 10);

  const adminDoc = {
    "firstName": "Admin",
    "lastName": "User",
    "email": email,
    "password": hashedPassword,
    "role": "admin",
    "isEmailVerified": true,
    "phone": "",
    "addresses": [],
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString()
  };

  const output = `==========================================
Here is the full MongoDB data for the admin:
==========================================
${JSON.stringify(adminDoc, null, 2)}
==========================================
With the email: ${email}
And the password: ${password}
You can insert this directly into MongoDB Compass.`;

  fs.writeFileSync('admin_mongo_utf8.txt', output, 'utf8');
}

generateMongoData();
