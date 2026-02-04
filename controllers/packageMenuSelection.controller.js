// -------- OCCASSIONS SERVICES CATEGORIES --------
import * as selectionService from '../services/packageMenuSelection.service.js';

export const saveMenuSelection = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { starters, mainCourses, desserts, breadRice } = req.body;

    if (!packageId) {
      return res.status(400).json({ message: 'Package ID is strictly required' });
    }

    const result = await selectionService.upsertMenuSelection(packageId, {
      starters,
      mainCourses,
      desserts,
      breadRice
    });

    res.status(200).json({
      success: true,
      message: 'Menu selection saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Save Menu Selection Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMenuSelection = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!packageId) {
      return res.status(400).json({ message: 'Package ID is strictly required' });
    }

    const selection = await selectionService.getSelectionByPackageId(packageId);

    res.status(200).json(selection);
  } catch (error) {
    console.error('Fetch Menu Selection Error:', error);
    res.status(500).json({ message: error.message });
  }
};
