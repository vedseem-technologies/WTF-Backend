import Food from '../models/popularFoodItems.models.js';

export const getAllFoodItems = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);
    const query = Food.find().lean().sort({ createdAt: -1 });

    if (!isNaN(limit) && limit > 0) {
      query.limit(limit);
    }

    const items = await query;
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFoodItem = async (req, res) => {
  const { name, price, image, description, rating } = req.body;

  if (!name || !price || !image) {
    return res.status(400).json({ message: 'Name, price, and image are required' });
  }

  try {
    const newItem = new Food({ name, price, image, description, rating });
    await newItem.save();
    res.status(201).json(newItem.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteFoodItem = async (req, res) => {
  try {
    const deletedItem = await Food.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
    console.log("POPULAR ITEM DELETED:", deletedItem)
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFoodItem = async (req, res) => {
  const { id } = req.params;
  const { name, price, image, description, rating } = req.body;

  if (!name || !price || !image) {
    return res.status(400).json({ message: 'Name, price, and image are required' });
  }

  try {
    const updatedItem = await Food.findByIdAndUpdate(
      id,
      { name, price, image, description, rating },
      { new: true, lean: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};