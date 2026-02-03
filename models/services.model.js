import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
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

serviceSchema.index({ active: 1, isDeleted: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
