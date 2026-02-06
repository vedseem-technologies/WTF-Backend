import Category from '../models/category.model.js';

// Get all categories
import { paginate } from '../utils/pagination.js';

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const { cursor, limit, direction, active, search } = req.query;
    const query = {};
    if (active !== undefined) {
      query.active = active === 'true';
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const result = await paginate(Category, query, { cursor, limit, direction });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new category
export const addCategory = async (req, res) => {
  const { title, image, active } = req.body;

  if (!title || !image) {
    return res.status(400).json({ message: 'Title and image are required' });
  }

  try {
    const newCategory = new Category({ title, image, active });
    await newCategory.save();
    res.status(201).json(newCategory.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { title, image, active } = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { title, image, active },
      { new: true, lean: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
