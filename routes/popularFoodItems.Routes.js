import express from 'express';
import { getAllFoodItems, addFoodItem, deleteFoodItem, updateFoodItem } from '../controllers/popularFoodItems.controllers.js';

const router = express.Router();


router.get('/', getAllFoodItems);

router.post('/', addFoodItem);


router.delete('/:id', deleteFoodItem);


router.put('/:id', updateFoodItem);

export default router;
