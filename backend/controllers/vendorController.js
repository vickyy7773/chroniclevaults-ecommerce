import Vendor from '../models/Vendor.js';

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private/Admin
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('Get all vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendors',
      error: error.message
    });
  }
};

// @desc    Get single vendor by ID
// @route   GET /api/vendors/:id
// @access  Private/Admin
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Get vendor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendor',
      error: error.message
    });
  }
};

// @desc    Create new vendor
// @route   POST /api/vendors
// @access  Private/Admin
export const createVendor = async (req, res) => {
  try {
    const {
      vendorCode,
      name,
      email,
      mobile,
      address,
      kycDocuments,
      commissionPercentage,
      bankDetails
    } = req.body;

    // Check if vendor code already exists
    if (vendorCode) {
      const existingVendor = await Vendor.findOne({ vendorCode });
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: 'Vendor code already exists'
        });
      }
    }

    // Check if email already exists
    const emailExists = await Vendor.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const vendor = await Vendor.create({
      vendorCode,
      name,
      email,
      mobile,
      address,
      kycDocuments,
      commissionPercentage,
      bankDetails
    });

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating vendor',
      error: error.message
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private/Admin
export const updateVendor = async (req, res) => {
  try {
    const {
      vendorCode,
      name,
      email,
      mobile,
      address,
      kycDocuments,
      commissionPercentage,
      bankDetails,
      status
    } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if vendor code is being changed and if it already exists
    if (vendorCode && vendorCode !== vendor.vendorCode) {
      const existingVendor = await Vendor.findOne({ vendorCode });
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: 'Vendor code already exists'
        });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== vendor.email) {
      const emailExists = await Vendor.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Update fields
    if (vendorCode) vendor.vendorCode = vendorCode;
    if (name) vendor.name = name;
    if (email) vendor.email = email;
    if (mobile) vendor.mobile = mobile;
    if (address) vendor.address = address;
    if (kycDocuments) vendor.kycDocuments = kycDocuments;
    if (commissionPercentage !== undefined) vendor.commissionPercentage = commissionPercentage;
    if (bankDetails) vendor.bankDetails = bankDetails;
    if (status) vendor.status = status;

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating vendor',
      error: error.message
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    await vendor.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting vendor',
      error: error.message
    });
  }
};

// @desc    Update vendor status
// @route   PUT /api/vendors/:id/status
// @access  Private/Admin
export const updateVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = status;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor status updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating vendor status',
      error: error.message
    });
  }
};
