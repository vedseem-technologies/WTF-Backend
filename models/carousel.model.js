import mongoose from 'mongoose';
import validator from 'validator';

const carouselSchema = new mongoose.Schema({
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

const Carousel = mongoose.model('Carousel', carouselSchema);

export default Carousel;
