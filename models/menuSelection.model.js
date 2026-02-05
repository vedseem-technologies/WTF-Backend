import mongoose from 'mongoose';

const menuSelectionSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['occasion', 'service', 'category', 'package'], // Added 'package' for backward compatibility if needed, but primary focus is on others.
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType' // Dynamic reference based on entityType
  },
  starters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  mainCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  desserts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  breadRice: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  unselectedStarters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  unselectedMainCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  unselectedDesserts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  unselectedBreadRice: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Compound unique index to ensure one menu selection per entity
menuSelectionSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

const MenuSelection = mongoose.model('MenuSelection', menuSelectionSchema);

export default MenuSelection;
