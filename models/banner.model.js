import mongoose from 'mongoose';
import validator from 'validator';

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  versionKey: false
});

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
