import express from 'express';
import {
  getAllMenuItems,
  addMenuItem,
  addBulkMenuItems,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemActive
} from '../controllers/menuItems.controllers.js';

const router = express.Router();

router.get('/', getAllMenuItems);
router.post('/', addMenuItem);
router.post('/bulk', addBulkMenuItems);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);
router.put('/:id/toggle-active', toggleMenuItemActive);

export default router;
