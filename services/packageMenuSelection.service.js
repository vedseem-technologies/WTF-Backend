// -------- OCCASSIONS --------
import PackageMenuSelection from '../models/packageMenuSelection.model.js';

export const upsertMenuSelection = async (packageId, data) => {
  try {
    const filter = { packageId };
    const update = {
      starters: data.starters || [],
      mainCourses: data.mainCourses || [],
      desserts: data.desserts || [],
      breadRice: data.breadRice || []
    };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };

    const selection = await PackageMenuSelection.findOneAndUpdate(
      filter,
      update,
      options
    ).lean();

    return selection;
  } catch (error) {
    throw new Error(`Error saving menu selection: ${error.message}`);
  }
};

export const getSelectionByPackageId = async (packageId) => {
  try {
    const selection = await PackageMenuSelection.findOne({ packageId })
      .lean();

    // Return empty structure if not found (standard data contract)
    if (!selection) {
      return {
        packageId,
        starters: [],
        mainCourses: [],
        desserts: [],
        breadRice: []
      };
    }

    return selection;
  } catch (error) {
    throw new Error(`Error fetching menu selection: ${error.message}`);
  }
};
