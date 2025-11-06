import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions
} from '../controllers/roleController.js';
import { protect, superAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and superadmin role
router.use(protect);
router.use(superAdmin);

// Role CRUD routes
router.route('/')
  .get(getAllRoles)      // Get all roles
  .post(createRole);     // Create new role

router.route('/:id')
  .get(getRoleById)      // Get role by ID
  .put(updateRole)       // Update role
  .delete(deleteRole);   // Delete role

// Get role permissions
router.get('/:id/permissions', getRolePermissions);

export default router;
