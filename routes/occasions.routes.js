import express from 'express';
import {
  getAllOccasions,
  addOccasion,
  updateOccasion,
  deleteOccasion,
  toggleOccasionActive
} from '../controllers/occasions.controllers.js';

const router = express.Router();


router.get('/', getAllOccasions);


router.post('/', addOccasion);


router.put('/:id', updateOccasion);

router.delete('/:id', deleteOccasion);

router.put('/:id/toggle-active', toggleOccasionActive);

export default router;
