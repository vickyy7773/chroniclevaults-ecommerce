import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parentCategory', 'name')
      .sort({ name: 1 });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productsCount = await Product.countDocuments({ category: category.name });
        const categoryObj = category.toObject();

        // Get subcategories if it's a main category
        if (category.type === 'main') {
          const subCategories = await Category.find({ parentCategory: category._id });
          categoryObj.subCategories = subCategories.map(sub => sub.name);
        }

        return {
          ...categoryObj,
          productsCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const productsCount = await Product.countDocuments({ category: category.name });
    const categoryObj = category.toObject();

    // Get subcategories if it's a main category
    if (category.type === 'main') {
      const subCategories = await Category.find({ parentCategory: category._id });
      categoryObj.subCategories = subCategories.map(sub => sub.name);
    }

    res.status(200).json({
      success: true,
      data: {
        ...categoryObj,
        productsCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, type, parentCategory, description, bannerImage, showOnHome, cardImage, isActive } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // If it's a subcategory, verify parent exists
    if (type === 'sub' && parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const category = await Category.create({
      name,
      type: type || 'main',
      parentCategory: type === 'sub' ? parentCategory : null,
      description,
      bannerImage,
      showOnHome: showOnHome || false,
      cardImage,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { name, type, parentCategory, description, bannerImage, showOnHome, cardImage, isActive } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if new name conflicts with another category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      // Update products with the old category name to the new name
      await Product.updateMany(
        { category: category.name },
        { category: name }
      );
    }

    // If it's a subcategory, verify parent exists
    if (type === 'sub' && parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        type,
        parentCategory: type === 'sub' ? parentCategory : null,
        description,
        bannerImage,
        showOnHome,
        cardImage,
        isActive
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: category.name });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productsCount} products. Please reassign or delete the products first.`
      });
    }

    // Check if category has subcategories
    const subCategories = await Category.find({ parentCategory: category._id });
    if (subCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${subCategories.length} subcategories. Please delete subcategories first.`
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// @desc    Get main categories only
// @route   GET /api/categories/main
// @access  Public
export const getMainCategories = async (req, res) => {
  try {
    const categories = await Category.find({ type: 'main', isActive: true })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch main categories',
      error: error.message
    });
  }
};

// @desc    Update category banner image
// @route   PUT /api/categories/:id/banner-image
// @access  Private/Admin
export const updateCategoryBannerImage = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Create full image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Update category with new banner image
    category.bannerImage = imageUrl;
    await category.save();

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category banner image updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update category banner image',
      error: error.message
    });
  }
};

// @desc    Update category card image
// @route   PUT /api/categories/:id/card-image
// @access  Private/Admin
export const updateCategoryCardImage = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Create full image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Update category with new card image
    category.cardImage = imageUrl;
    await category.save();

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category card image updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update category card image',
      error: error.message
    });
  }
};

// Keep old function for backward compatibility
export const updateCategoryImage = updateCategoryBannerImage;
