import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'WTF - Email Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 36px; font-weight: 900; color: #dc2626; font-style: italic; }
          .otp-box { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 48px; font-weight: 900; letter-spacing: 8px; margin: 20px 0; }
          .message { color: #666; line-height: 1.6; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WTF</div>
            <h2 style="color: #333; margin-top: 10px;">Email Verification</h2>
          </div>
          <p class="message">Hi ${firstName},</p>
          <p class="message">Welcome to WTF! Please use the following OTP to verify your email address:</p>
          <div class="otp-box">
            <div style="font-size: 14px; opacity: 0.9;">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; opacity: 0.8;">Valid for 10 minutes</div>
          </div>
          <p class="message">If you didn't request this verification, please ignore this email.</p>
          <div class="footer">
            <p>© 2026 WTF. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Signup - Step 1: Create user and send OTP
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: 'Email already registered and verified' });
      }
      // If user exists but not verified, resend OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      existingUser.emailVerificationOTP = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();

      await sendOTPEmail(email, otp, existingUser.firstName);
      return res.status(200).json({
        message: 'OTP resent to your email',
        userId: existingUser._id,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      emailVerificationOTP: otp,
      otpExpiry,
      isEmailVerified: false,
    });

    await newUser.save();

    // Send OTP email
    await sendOTPEmail(email, otp, firstName);

    res.status(201).json({
      message: 'User created. OTP sent to your email',
      userId: newUser._id,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one' });
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.firstName);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please verify your email first',
        userId: user._id,
        needsVerification: true,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
