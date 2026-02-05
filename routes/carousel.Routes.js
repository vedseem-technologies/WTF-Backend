import express from 'express';
import {
  getAllCarouselImages,
  addCarouselImage,
  deleteCarouselImage
} from '../controllers/carousel.controllers.js';

const router = express.Router();

router.get('/', getAllCarouselImages);
router.post('/', addCarouselImage);
router.delete('/:id', deleteCarouselImage);

export default router;
