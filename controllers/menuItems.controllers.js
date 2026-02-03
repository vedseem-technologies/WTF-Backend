import MenuItem from '../models/menuItems.model.js';


export const getAllMenuItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default to 20 items per page
    const skip = (page - 1) * limit;

    const { category, type, active } = req.query;
    const query = { isDeleted: false }; // Only fetch non-deleted items

    if (category) query.category = category;
    if (type) query.type = type;
    if (active) query.active = active === 'true';

    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MenuItem.countDocuments(query)
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
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
