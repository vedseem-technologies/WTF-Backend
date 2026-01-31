import Occasion from '../models/occasions.model.js';

export const getAllOccasions = async (req, res) => {
  try {
    const occasions = await Occasion.find().lean().sort({ createdAt: -1 });
    res.status(200).json(occasions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addOccasion = async (req, res) => {
  const { title, image, active } = req.body;

  if (!title || !image) {
    return res.status(400).json({ message: 'Title and image are required' });
  }

  try {
    const newOccasion = new Occasion({ title, image, active });
    await newOccasion.save();
    res.status(201).json(newOccasion.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOccasion = async (req, res) => {
  const { id } = req.params;
  const { title, image, active } = req.body;

  try {
    const updatedOccasion = await Occasion.findByIdAndUpdate(
      id,
      { title, image, active },
      { new: true, lean: true }
    );

    if (!updatedOccasion) {
      return res.status(404).json({ message: 'Occasion not found' });
    }

    res.status(200).json(updatedOccasion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOccasion = async (req, res) => {
  try {
    const deletedOccasion = await Occasion.findByIdAndDelete(req.params.id);

    if (!deletedOccasion) {
      return res.status(404).json({ message: 'Occasion not found' });
    }

    res.status(200).json({ message: 'Occasion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
