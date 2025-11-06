import express from 'express';
import PagePoster from '../models/PagePoster.js';

const router = express.Router();

// Get all page posters
router.get('/', async (req, res) => {
  try {
    const posters = await PagePoster.find().sort({ pageName: 1 });
    res.status(200).json({
      success: true,
      data: posters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page posters',
      error: error.message
    });
  }
});

// Get poster by page name
router.get('/:pageName', async (req, res) => {
  try {
    const poster = await PagePoster.findOne({ pageName: req.params.pageName });
    if (!poster) {
      return res.status(404).json({
        success: false,
        message: 'Poster not found for this page'
      });
    }
    res.status(200).json({
      success: true,
      data: poster
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch poster',
      error: error.message
    });
  }
});

// Create or update page poster
router.post('/', async (req, res) => {
  try {
    const { pageName, posterImage, title, subtitle, isActive } = req.body;

    // Check if poster already exists for this page
    let poster = await PagePoster.findOne({ pageName });

    if (poster) {
      // Update existing poster
      poster.posterImage = posterImage;
      poster.title = title;
      poster.subtitle = subtitle || '';
      poster.isActive = isActive !== undefined ? isActive : true;
      await poster.save();
    } else {
      // Create new poster
      poster = await PagePoster.create({
        pageName,
        posterImage,
        title,
        subtitle: subtitle || '',
        isActive: isActive !== undefined ? isActive : true
      });
    }

    res.status(200).json({
      success: true,
      data: poster,
      message: 'Page poster saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save page poster',
      error: error.message
    });
  }
});

// Update page poster
router.put('/:id', async (req, res) => {
  try {
    const { posterImage, title, subtitle, isActive } = req.body;

    const poster = await PagePoster.findByIdAndUpdate(
      req.params.id,
      { posterImage, title, subtitle, isActive },
      { new: true, runValidators: true }
    );

    if (!poster) {
      return res.status(404).json({
        success: false,
        message: 'Poster not found'
      });
    }

    res.status(200).json({
      success: true,
      data: poster,
      message: 'Page poster updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update page poster',
      error: error.message
    });
  }
});

// Delete page poster
router.delete('/:id', async (req, res) => {
  try {
    const poster = await PagePoster.findByIdAndDelete(req.params.id);

    if (!poster) {
      return res.status(404).json({
        success: false,
        message: 'Poster not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Page poster deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete page poster',
      error: error.message
    });
  }
});

export default router;
