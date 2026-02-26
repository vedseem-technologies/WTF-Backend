import express from 'express';
import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive
} from '../controllers/categories.controllers.js';

const router = express.Router();

router.get('/', getAllCategories);
router.post('/', addCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.put('/:id/toggle-active', toggleCategoryActive);

export default router;
