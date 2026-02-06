import Banner from '../models/banner.model.js';

import { paginate } from '../utils/pagination.js';

export const getAllBannerImages = async (req, res) => {
  try {
    const { cursor, limit, direction, search } = req.query;
    const query = {};
    if (search) {
      query.image = { $regex: search, $options: 'i' };
    }
    const result = await paginate(Banner, query, { cursor, limit, direction });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addBannerImage = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ message: 'Image is required' });
  }

  try {
    const newImage = new Banner({ image });
    res.status(201).json(newImage.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBannerImage = async (req, res) => {
  try {
    const deletedImage = await Banner.findByIdAndDelete(req.params.id);

    if (!deletedImage) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
