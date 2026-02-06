import Carousel from '../models/carousel.model.js';

import { paginate } from '../utils/pagination.js';

export const getAllCarouselImages = async (req, res) => {
  try {
    const { cursor, limit, direction, search } = req.query;
    const query = {};
    if (search) {
      query.image = { $regex: search, $options: 'i' };
    }
    const result = await paginate(Carousel, query, { cursor, limit, direction });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCarouselImage = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  try {
    const newImage = new Carousel({ image });
    res.status(201).json(newImage.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCarouselImage = async (req, res) => {
  try {
    const deletedImage = await Carousel.findByIdAndDelete(req.params.id);

    if (!deletedImage) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
