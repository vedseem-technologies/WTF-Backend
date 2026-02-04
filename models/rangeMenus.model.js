import mongoose from 'mongoose';

const rangeMenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  range: {
    type: String,
    enum: ["Paneer Range", "Fast Food Range", "Chinese Range"],
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false
});

const RangeMenu = mongoose.model('RangeMenu', rangeMenuSchema);

export default RangeMenu;
