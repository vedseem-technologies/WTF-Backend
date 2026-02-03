import MenuSelection from '../models/menuSelection.model.js';
import MenuItem from '../models/menuItems.model.js';

/**
 * Get menu selection for a specific entity
 * @param {string} entityType 
 * @param {string} entityId 
 * @returns {Promise<Object>}
 */
export const getMenuSelection = async (entityType, entityId) => {
  try {
    const selection = await MenuSelection.findOne({ entityType, entityId })
      .lean();

    // Return empty structure if not found (Contract)
    if (!selection) {
      return {
        entityType,
        entityId,
        starters: [],
        mainCourses: [],
        desserts: [],
        breadRice: []
      };
    }
    return selection;
  } catch (error) {
    throw error;
  }
};

/**
 * Upsert menu selection for an entity
 * @param {string} entityType 
 * @param {string} entityId 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const upsertMenuSelection = async (entityType, entityId, data) => {
  try {
    // Basic validation of lists can go here if needed
    // Removing duplicates from input arrays using Set
    const uniqueIds = (arr) => [...new Set(arr || [])];

    const updateData = {
      starters: uniqueIds(data.starters),
      mainCourses: uniqueIds(data.mainCourses),
      desserts: uniqueIds(data.desserts),
      breadRice: uniqueIds(data.breadRice)
    };

    const selection = await MenuSelection.findOneAndUpdate(
      { entityType, entityId },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return selection;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete menu selection for an entity
 * @param {string} entityType 
 * @param {string} entityId 
 * @returns {Promise<boolean>}
 */
export const deleteMenuSelection = async (entityType, entityId) => {
  try {
    await MenuSelection.deleteOne({ entityType, entityId });
    return true;
  } catch (error) {
    throw error;
  }
}
