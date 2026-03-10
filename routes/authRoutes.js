import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken, generateAdminToken, verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phone, password, addresses } = req.body;
  const filteredAddresses = addresses ? addresses.filter(addr => addr.trim() !== '') : [];

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      addresses: filteredAddresses,
      isEmailVerified: true,
    });

    await newUser.save();

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        addresses: newUser.addresses,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.post('/verify-otp', async (req, res) => {
//   const { userId, otp } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (user.isEmailVerified) {
//       return res.status(400).json({ message: 'Email already verified' });
//     }

//     if (new Date() > user.otpExpiry) {
//       return res.status(400).json({ message: 'OTP expired. Please request a new one' });
//     }

//     if (user.emailVerificationOTP !== otp) {
//       return res.status(400).json({ message: 'Invalid OTP' });
//     }

//     user.isEmailVerified = true;
//     user.emailVerificationOTP = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     const token = generateToken(user);

//     res.status(200).json({
//       message: 'Email verified successfully',
//       token,
//       user: {
//         id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         addresses: user.addresses,
//         isEmailVerified: user.isEmailVerified,
//       },
//     });
//   } catch (error) {
//     console.error('OTP verification error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// router.post('/resend-otp', async (req, res) => {
//   const { userId } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (user.isEmailVerified) {
//       return res.status(400).json({ message: 'Email already verified' });
//     }

//     const otp = generateOTP();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

//     user.emailVerificationOTP = otp;
//     user.otpExpiry = otpExpiry;
//     await user.save();

//     await sendOTPEmail(user.email, otp, user.firstName);

//     res.status(200).json({ message: 'OTP resent successfully' });
//   } catch (error) {
//     console.error('Resend OTP error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials' });
    }



    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json();
  }
});

export default router;

router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Requires admin privileges' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateAdminToken(user);

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json();
  }
});

router.post('/create-admin', verifyToken, isAdmin, async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      user: {
        id: newAdmin._id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/admins', verifyToken, isAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/admins/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent an admin from deleting themselves if desired, but for now we just delete the user.
    if (req.userData.userId === id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const deletedAdmin = await User.findOneAndDelete({ _id: id, role: 'admin' });

    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/admins/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, password } = req.body;

    const adminToUpdate = await User.findOne({ _id: id, role: 'admin' });
    if (!adminToUpdate) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (email && email !== adminToUpdate.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      adminToUpdate.email = email;
    }

    if (firstName) adminToUpdate.firstName = firstName;
    if (lastName) adminToUpdate.lastName = lastName;
    if (phone !== undefined) adminToUpdate.phone = phone;

    if (password) {
      adminToUpdate.password = await bcrypt.hash(password, 10);
    }

    await adminToUpdate.save();

    res.status(200).json({
      message: 'Admin updated successfully',
      user: {
        _id: adminToUpdate._id,
        firstName: adminToUpdate.firstName,
        lastName: adminToUpdate.lastName,
        email: adminToUpdate.email,
        phone: adminToUpdate.phone,
        role: adminToUpdate.role,
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
