import express from 'express';
import {
  getAllServices,
  addService,
  updateService,
  deleteService,
  toggleServiceActive
} from '../controllers/services.controllers.js';

const router = express.Router();

router.get('/', getAllServices);
router.post('/', addService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.put('/:id/toggle-active', toggleServiceActive);

export default router;
