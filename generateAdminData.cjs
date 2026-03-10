require('dotenv').config();
const bcrypt = require('bcryptjs');

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

  console.log("==========================================");
  console.log("Here is the full MongoDB data for the admin:");
  console.log("==========================================");
  console.log(JSON.stringify(adminDoc, null, 2));
  console.log("==========================================");
  console.log(`With the email: ${email}`);
  console.log(`And the password: ${password}`);
  console.log("You can insert this directly into MongoDB Compass.");
}

generateMongoData();
