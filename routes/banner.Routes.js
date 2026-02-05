import express from 'express';
import {
  getAllBannerImages,
  addBannerImage,
  deleteBannerImage
} from '../controllers/banner.controllers.js';

const router = express.Router();

router.get('/', getAllBannerImages);
router.post('/', addBannerImage);
router.delete('/:id', deleteBannerImage);

export default router;
