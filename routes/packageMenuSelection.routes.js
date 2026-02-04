// -------- OCCASSIONS  SERVICES  CATEGORIES  --------
import express from 'express';
import { saveMenuSelection, getMenuSelection } from '../controllers/packageMenuSelection.controller.js';

const router = express.Router();

// Define routes with strict packageId param
router.post('/:packageId/menu-selection', saveMenuSelection);
router.get('/:packageId/menu-selection', getMenuSelection);

export default router;
