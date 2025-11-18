import express from 'express';
import { incrementVisitor, getVisitorCount } from '../controllers/visitorController.js';

const router = express.Router();

// Public routes
router.post('/increment', incrementVisitor);
router.get('/count', getVisitorCount);

export default router;
