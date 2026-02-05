import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  addresses: {
    type: [String],
    default: [],
  },
  emailVerificationOTP: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
