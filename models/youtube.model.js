import mongoose from 'mongoose';
import validator from 'validator';

const youtubeSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: validator.isURL,
      message: 'Invalid URL format',
    },
  },
}, {
  timestamps: true,
  versionKey: false
});

const Youtube = mongoose.model('Youtube', youtubeSchema);

export default Youtube;
