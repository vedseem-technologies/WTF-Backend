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
    index: true, // Optimized for filtering active occasions
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true, // Optimization for soft delete queries
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index for common queries
occasionSchema.index({ active: 1, isDeleted: 1 });

const Occasion = mongoose.model('Occasion', occasionSchema);

export default Occasion;
