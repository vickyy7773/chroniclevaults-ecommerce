import Slider from '../models/Slider.js';

// @desc    Get all sliders
// @route   GET /api/sliders
// @access  Public
export const getAllSliders = async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: sliders.length,
      data: sliders
    });
  } catch (error) {
    console.error('Error fetching sliders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sliders',
      error: error.message
    });
  }
};

// @desc    Get all sliders (including inactive) - Admin only
// @route   GET /api/sliders/all
// @access  Private/Admin
export const getAllSlidersAdmin = async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: sliders.length,
      data: sliders
    });
  } catch (error) {
    console.error('Error fetching sliders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sliders',
      error: error.message
    });
  }
};

// @desc    Get single slider
// @route   GET /api/sliders/:id
// @access  Public
export const getSliderById = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider not found'
      });
    }

    res.status(200).json({
      success: true,
      data: slider
    });
  } catch (error) {
    console.error('Error fetching slider:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching slider',
      error: error.message
    });
  }
};

// @desc    Create new slider
// @route   POST /api/sliders
// @access  Private/Admin
export const createSlider = async (req, res) => {
  try {
    const { title, subtitle, buttonText, buttonLink, image, order, isActive } = req.body;

    // Validate required fields
    if (!title || !image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and image'
      });
    }

    const slider = await Slider.create({
      title,
      subtitle,
      buttonText,
      buttonLink,
      image,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Slider created successfully',
      data: slider
    });
  } catch (error) {
    console.error('Error creating slider:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating slider',
      error: error.message
    });
  }
};

// @desc    Update slider
// @route   PUT /api/sliders/:id
// @access  Private/Admin
export const updateSlider = async (req, res) => {
  try {
    const { title, subtitle, buttonText, buttonLink, image, order, isActive } = req.body;

    const slider = await Slider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider not found'
      });
    }

    // Update fields
    if (title !== undefined) slider.title = title;
    if (subtitle !== undefined) slider.subtitle = subtitle;
    if (buttonText !== undefined) slider.buttonText = buttonText;
    if (buttonLink !== undefined) slider.buttonLink = buttonLink;
    if (image !== undefined) slider.image = image;
    if (order !== undefined) slider.order = order;
    if (isActive !== undefined) slider.isActive = isActive;

    await slider.save();

    res.status(200).json({
      success: true,
      message: 'Slider updated successfully',
      data: slider
    });
  } catch (error) {
    console.error('Error updating slider:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating slider',
      error: error.message
    });
  }
};

// @desc    Delete slider
// @route   DELETE /api/sliders/:id
// @access  Private/Admin
export const deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider not found'
      });
    }

    await slider.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Slider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting slider:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting slider',
      error: error.message
    });
  }
};

// @desc    Update slider order
// @route   PUT /api/sliders/reorder
// @access  Private/Admin
export const reorderSliders = async (req, res) => {
  try {
    const { sliders } = req.body; // Array of { id, order }

    if (!sliders || !Array.isArray(sliders)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sliders array'
      });
    }

    // Update order for each slider
    const updatePromises = sliders.map(({ id, order }) =>
      Slider.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedSliders = await Slider.find().sort({ order: 1 });

    res.status(200).json({
      success: true,
      message: 'Slider order updated successfully',
      data: updatedSliders
    });
  } catch (error) {
    console.error('Error reordering sliders:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering sliders',
      error: error.message
    });
  }
};
