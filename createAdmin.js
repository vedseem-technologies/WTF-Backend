import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = process.env.Admin_Email;
        const password = process.env.Admin_Pass;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: email,
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true
        });

        await admin.save();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

createAdmin();
