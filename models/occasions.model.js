import mongoose from 'mongoose';

const occasionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  }
}, {
  timestamps: true,
  versionKey: false
});

occasionSchema.index({ active: 1, isDeleted: 1 });

const Occasion = mongoose.model('Occasion', occasionSchema);

export default Occasion;
