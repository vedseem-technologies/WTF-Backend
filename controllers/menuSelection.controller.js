import * as menuService from '../services/menuSelection.service.js';

export const getMenuSelection = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const selection = await menuService.getMenuSelection(entityType, entityId);
    res.status(200).json(selection);
  } catch (error) {
    console.error(`Error fetching menu for ${req.params.entityType}/${req.params.entityId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const saveMenuSelection = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const data = req.body;

    // Basic validation
    if (!['occasion', 'service', 'category', 'package'].includes(entityType)) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    const selection = await menuService.upsertMenuSelection(entityType, entityId, data);
    res.status(200).json({ success: true, data: selection });
  } catch (error) {
    console.error(`Error saving menu for ${req.params.entityType}/${req.params.entityId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMenuSelection = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    await menuService.deleteMenuSelection(entityType, entityId);
    res.status(200).json({ success: true, message: 'Menu selection deleted' });
  } catch (error) {
    console.error(`Error deleting menu for ${req.params.entityType}/${req.params.entityId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
