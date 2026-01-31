import Package from '../models/Package.models.js';

export const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find().lean().populate('selectedItems').sort({ createdAt: -1 });

    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPackage = async (req, res) => {
  const { packageName, price, numberOfPeople, image, isVeg, occasionId, selectedItems } = req.body;

  if (!packageName || !price || !numberOfPeople || !image || !occasionId) {
    return res.status(400).json({ message: 'Package name, price, number of people, image, and occasionId are required' });
  }

  if (numberOfPeople < 8) {
    return res.status(400).json({ message: 'Number of people must be at least 8' });
  }

  try {
    const newPackage = new Package({ packageName, price, numberOfPeople, image, isVeg, occasionId, selectedItems });
    await newPackage.save();
    res.status(201).json(newPackage.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update package
export const updatePackage = async (req, res) => {
  const { id } = req.params;
  const { packageName, price, numberOfPeople, image, isVeg, occasionId, selectedItems } = req.body;

  try {
    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      { packageName, price, numberOfPeople, image, isVeg, occasionId, selectedItems },
      { new: true, lean: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.status(200).json(updatedPackage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete package
export const deletePackage = async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);

    if (!deletedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.status(200).json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
