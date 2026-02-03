import mongoose from 'mongoose';

const packageMenuSelectionSchema = new mongoose.Schema({
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true,
    unique: true
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
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Index to ensure efficient lookups by packageId
packageMenuSelectionSchema.index({ packageId: 1 });

const PackageMenuSelection = mongoose.model('PackageMenuSelection', packageMenuSelectionSchema);

export default PackageMenuSelection;
