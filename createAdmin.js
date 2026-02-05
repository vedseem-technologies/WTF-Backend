import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = 'admin@wtf.com';
        const password = 'admin123';

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Admin already exists!');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: email,
            password: hashedPassword,
            isEmailVerified: true
        });

        await admin.save();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

createAdmin();
