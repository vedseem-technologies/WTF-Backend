import express from 'express';
import Food from '../models/Food.js';

const router = express.Router();

// Get all food items
router.get('/get-food-items', async (req, res) => {
  try {
    const items = await Food.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new food item
router.post('/add-food-items', async (req, res) => {
  const { name, price, image, description, isVeg } = req.body;
  try {
    const newItem = new Food({ name, price, image, description, isVeg });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete food item
router.delete('/delete-food-items/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
