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
    type: String, 
    required: true,
  },
  description: {
    type: String,
  },
  rating: {
    type: Number,
    default: 5,
  },
}, {
  timestamps: true,
  versionKey: false
});

const Food = mongoose.model('Food', foodSchema);

export default Food;
