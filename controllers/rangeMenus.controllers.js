import RangeMenu from '../models/rangeMenus.model.js';

// Get all range menus
import { paginate } from '../utils/pagination.js';

// Get all range menus
export const getAllRangeMenus = async (req, res) => {
  try {
    const { cursor, limit, direction, search } = req.query;
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const result = await paginate(RangeMenu, query, { cursor, limit, direction });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new range menu
export const addRangeMenu = async (req, res) => {
  const { name, image, rating, range } = req.body;

  if (!name || !image || !rating || !range) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newMenu = new RangeMenu({ name, image, rating, range });
    await newMenu.save();
    res.status(201).json(newMenu.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update range menu
export const updateRangeMenu = async (req, res) => {
  const { id } = req.params;
  const { name, image, rating, range } = req.body;

  try {
    const updatedMenu = await RangeMenu.findByIdAndUpdate(
      id,
      { name, image, rating, range },
      { new: true, lean: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete range menu
export const deleteRangeMenu = async (req, res) => {
  try {
    const deletedMenu = await RangeMenu.findByIdAndDelete(req.params.id);

    if (!deletedMenu) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
