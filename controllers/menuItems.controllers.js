import MenuItem from '../models/menuItems.model.js';


import { paginate } from '../utils/pagination.js';

export const getAllMenuItems = async (req, res) => {
  try {
    const { cursor, limit, direction, category, type, active } = req.query;
    const query = { isDeleted: false };

    if (category) query.category = category;
    if (type) query.type = type;
    if (active !== undefined) {
      query.active = active === 'true';
    }

    const result = await paginate(MenuItem, query, { cursor, limit, direction });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const addMenuItem = async (req, res) => {
  const { name, image, type, category, people, quantity, measurement, unitPrice, active } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Name and category are required' });
  }

  try {
    const newItem = new MenuItem({
      name,
      image,
      type,
      category,
      people,
      quantity,
      measurement,
      unitPrice,
      active
    });
    await newItem.save();
    res.status(201).json(newItem.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const addBulkMenuItems = async (req, res) => {
  const items = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Invalid data format. Expected an array of items.' });
  }

  try {
    const newItems = await MenuItem.insertMany(items);
    res.status(201).json(newItems.map(item => item.toObject()));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const updateMenuItem = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      req.body,
      { new: true, lean: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteMenuItem = async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
