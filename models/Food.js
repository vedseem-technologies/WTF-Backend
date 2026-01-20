import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String, // Base64 string for now
    required: true,
  },
  description: {
    type: String,
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const Food = mongoose.model('Food', foodSchema);

export default Food;
