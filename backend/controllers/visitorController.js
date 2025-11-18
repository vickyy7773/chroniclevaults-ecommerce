import Visitor from '../models/Visitor.js';

// @desc    Get and increment visitor count
// @route   POST /api/visitors/increment
// @access  Public
export const incrementVisitor = async (req, res) => {
  try {
    // Find the visitor counter document (there should only be one)
    let visitor = await Visitor.findOne();

    if (!visitor) {
      // Create initial visitor counter if it doesn't exist
      visitor = await Visitor.create({ totalCount: 1000 });
    } else {
      // Increment the counter
      visitor.totalCount += 1;
      visitor.lastUpdated = Date.now();
      await visitor.save();
    }

    res.json({ count: visitor.totalCount });
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    res.status(500).json({ message: 'Error updating visitor count' });
  }
};

// @desc    Get visitor count without incrementing
// @route   GET /api/visitors/count
// @access  Public
export const getVisitorCount = async (req, res) => {
  try {
    let visitor = await Visitor.findOne();

    if (!visitor) {
      visitor = await Visitor.create({ totalCount: 1000 });
    }

    res.json({ count: visitor.totalCount });
  } catch (error) {
    console.error('Error getting visitor count:', error);
    res.status(500).json({ message: 'Error fetching visitor count' });
  }
};
