import express from 'express';
import {
  getAllBlogs,
  getPublishedBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImage
} from '../controllers/blogController.js';
// import { protect, admin } from '../middleware/auth.js'; // Uncomment when auth is needed

const router = express.Router();

// Public routes
router.get('/published', getPublishedBlogs);
router.get('/:id', getBlogById);

// Admin routes (temporarily without auth for testing)
router.route('/')
  .get(getAllBlogs)
  .post(createBlog); // Add protect, admin middleware when auth is ready

router.route('/:id')
  .put(updateBlog) // Add protect, admin middleware when auth is ready
  .delete(deleteBlog); // Add protect, admin middleware when auth is ready

// Image upload route
router.post('/upload-image', uploadBlogImage); // Add protect, admin middleware when auth is ready

export default router;
