import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg'],
    default: 'Veg',
    index: true,
  },
  category: {
    type: Number,
    required: true,
    index: true, // Critical for filtering by category
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
  },
  people: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  measurement: {
    type: String,
    enum: ['kg', 'pcs'],
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false
});

// Composite index for common "Show me active Veg Starters" queries
menuItemSchema.index({ category: 1, type: 1, active: 1, isDeleted: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
