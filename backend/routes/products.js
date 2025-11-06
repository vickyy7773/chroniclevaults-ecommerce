import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(createProduct); // Temporarily removed auth for testing

router.get('/featured', getFeaturedProducts);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct) // Temporarily removed auth for testing
  .delete(deleteProduct); // Temporarily removed auth for testing

export default router;
