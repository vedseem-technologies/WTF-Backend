import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json();
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json();
  }
};
