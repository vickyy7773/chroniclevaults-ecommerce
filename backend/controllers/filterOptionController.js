import FilterOption from '../models/FilterOption.js';

// @desc    Get all filter options grouped by type
// @route   GET /api/filter-options
// @access  Public
export const getAllFilterOptions = async (req, res) => {
  try {
    const grouped = await FilterOption.getAllGrouped();

    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

// @desc    Get filter options by type
// @route   GET /api/filter-options/:type
// @access  Public
export const getFilterOptionsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['rarity', 'condition', 'denomination', 'metal'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filter type'
      });
    }

    const options = await FilterOption.getByType(type);

    res.status(200).json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error fetching filter options by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

// @desc    Create a new filter option
// @route   POST /api/filter-options
// @access  Private/Admin
export const createFilterOption = async (req, res) => {
  try {
    const { type, value, displayOrder, description } = req.body;

    // Check if option already exists
    const existingOption = await FilterOption.findOne({ type, value });
    if (existingOption) {
      return res.status(400).json({
        success: false,
        message: `Filter option "${value}" already exists for type "${type}"`
      });
    }

    const filterOption = await FilterOption.create({
      type,
      value,
      displayOrder,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Filter option created successfully',
      data: filterOption
    });
  } catch (error) {
    console.error('Error creating filter option:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating filter option',
      error: error.message
    });
  }
};

// @desc    Update a filter option
// @route   PUT /api/filter-options/:id
// @access  Private/Admin
export const updateFilterOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, displayOrder, isActive, description } = req.body;

    const filterOption = await FilterOption.findById(id);
    if (!filterOption) {
      return res.status(404).json({
        success: false,
        message: 'Filter option not found'
      });
    }

    // Update fields
    if (value !== undefined) filterOption.value = value;
    if (displayOrder !== undefined) filterOption.displayOrder = displayOrder;
    if (isActive !== undefined) filterOption.isActive = isActive;
    if (description !== undefined) filterOption.description = description;

    await filterOption.save();

    res.status(200).json({
      success: true,
      message: 'Filter option updated successfully',
      data: filterOption
    });
  } catch (error) {
    console.error('Error updating filter option:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating filter option',
      error: error.message
    });
  }
};

// @desc    Delete a filter option
// @route   DELETE /api/filter-options/:id
// @access  Private/Admin
export const deleteFilterOption = async (req, res) => {
  try {
    const { id } = req.params;

    const filterOption = await FilterOption.findById(id);
    if (!filterOption) {
      return res.status(404).json({
        success: false,
        message: 'Filter option not found'
      });
    }

    await filterOption.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Filter option deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting filter option:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting filter option',
      error: error.message
    });
  }
};

// @desc    Get all filter options for admin (including inactive)
// @route   GET /api/filter-options/admin/all
// @access  Private/Admin
export const getAllFilterOptionsAdmin = async (req, res) => {
  try {
    const options = await FilterOption.find()
      .sort({ type: 1, displayOrder: 1, value: 1 })
      .select('-__v');

    // Group by type
    const grouped = {
      rarity: [],
      condition: [],
      denomination: [],
      metal: []
    };

    options.forEach(option => {
      if (grouped[option.type]) {
        grouped[option.type].push(option);
      }
    });

    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error fetching admin filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

// @desc    Initialize default filter options
// @route   POST /api/filter-options/admin/initialize
// @access  Private/Admin
export const initializeDefaultOptions = async (req, res) => {
  try {
    // Check if options already exist
    const existingCount = await FilterOption.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Filter options already initialized'
      });
    }

    const defaultOptions = [
      // Rarity
      { type: 'rarity', value: 'Common', displayOrder: 1 },
      { type: 'rarity', value: 'Uncommon', displayOrder: 2 },
      { type: 'rarity', value: 'Rare', displayOrder: 3 },
      { type: 'rarity', value: 'Very Rare', displayOrder: 4 },
      { type: 'rarity', value: 'Extremely Rare', displayOrder: 5 },

      // Condition
      { type: 'condition', value: 'Poor', displayOrder: 1 },
      { type: 'condition', value: 'Fair', displayOrder: 2 },
      { type: 'condition', value: 'Good', displayOrder: 3 },
      { type: 'condition', value: 'Very Fine', displayOrder: 4 },
      { type: 'condition', value: 'Extremely Fine', displayOrder: 5 },
      { type: 'condition', value: 'Uncirculated', displayOrder: 6 },

      // Denomination
      { type: 'denomination', value: 'Penny', displayOrder: 1 },
      { type: 'denomination', value: 'Nickel', displayOrder: 2 },
      { type: 'denomination', value: 'Dime', displayOrder: 3 },
      { type: 'denomination', value: 'Quarter', displayOrder: 4 },
      { type: 'denomination', value: 'Half Dollar', displayOrder: 5 },
      { type: 'denomination', value: 'Dollar', displayOrder: 6 },
      { type: 'denomination', value: 'Rupee', displayOrder: 7 },
      { type: 'denomination', value: 'Paise', displayOrder: 8 },
      { type: 'denomination', value: 'Anna', displayOrder: 9 },

      // Metal
      { type: 'metal', value: 'Gold', displayOrder: 1 },
      { type: 'metal', value: 'Silver', displayOrder: 2 },
      { type: 'metal', value: 'Bronze', displayOrder: 3 },
      { type: 'metal', value: 'Copper', displayOrder: 4 },
      { type: 'metal', value: 'Nickel', displayOrder: 5 },
      { type: 'metal', value: 'Brass', displayOrder: 6 },
      { type: 'metal', value: 'Platinum', displayOrder: 7 },
      { type: 'metal', value: 'Aluminum', displayOrder: 8 }
    ];

    await FilterOption.insertMany(defaultOptions);

    res.status(201).json({
      success: true,
      message: 'Default filter options initialized successfully',
      count: defaultOptions.length
    });
  } catch (error) {
    console.error('Error initializing default options:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing default options',
      error: error.message
    });
  }
};
