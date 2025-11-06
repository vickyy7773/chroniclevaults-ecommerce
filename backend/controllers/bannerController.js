import Banner from '../models/Banner.js';

// @desc    Get active banner
// @route   GET /api/banners/active
// @access  Public
export const getActiveBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Get active banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching banner',
      error: error.message
    });
  }
};

// @desc    Get all banners
// @route   GET /api/banners
// @access  Private/Admin
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Get all banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching banners',
      error: error.message
    });
  }
};

// @desc    Get single banner by ID
// @route   GET /api/banners/:id
// @access  Private/Admin
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Get banner by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching banner',
      error: error.message
    });
  }
};

// @desc    Create new banner
// @route   POST /api/banners
// @access  Private/Admin
export const createBanner = async (req, res) => {
  try {
    const { heading, title, description, imageUrl, linkUrl, isActive } = req.body;

    // If this banner is being set as active, deactivate all others
    if (isActive) {
      await Banner.updateMany({}, { isActive: false });
    }

    const banner = await Banner.create({
      heading,
      title,
      description,
      imageUrl,
      linkUrl,
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating banner',
      error: error.message
    });
  }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res) => {
  try {
    const { heading, title, description, imageUrl, linkUrl, isActive } = req.body;

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // If this banner is being set as active, deactivate all others
    if (isActive) {
      await Banner.updateMany(
        { _id: { $ne: req.params.id } },
        { isActive: false }
      );
    }

    banner.heading = heading !== undefined ? heading : banner.heading;
    banner.title = title || banner.title;
    banner.description = description !== undefined ? description : banner.description;
    banner.imageUrl = imageUrl || banner.imageUrl;
    banner.linkUrl = linkUrl !== undefined ? linkUrl : banner.linkUrl;
    banner.isActive = isActive !== undefined ? isActive : banner.isActive;

    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating banner',
      error: error.message
    });
  }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting banner',
      error: error.message
    });
  }
};

// @desc    Toggle banner active status
// @route   PUT /api/banners/:id/toggle
// @access  Private/Admin
export const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // If activating this banner, deactivate all others
    if (!banner.isActive) {
      await Banner.updateMany(
        { _id: { $ne: req.params.id } },
        { isActive: false }
      );
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling banner status',
      error: error.message
    });
  }
};
