import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
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

categorySchema.index({ active: 1, isDeleted: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
