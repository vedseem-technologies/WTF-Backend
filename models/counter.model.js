import mongoose from 'mongoose';

// Counter schema for auto-incrementing order numbers
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 }
});

counterSchema.statics.getNextSequence = async function (sequenceName) {
  const counter = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema);
