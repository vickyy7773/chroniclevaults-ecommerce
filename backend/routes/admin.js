import express from 'express';
import {
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  assignRoleToUser,
  getUserPermissions
} from '../controllers/adminController.js';
import {
  getAllActivities,
  getAdminActivities,
  getAdminSessions,
  getActivityStats,
  getActivityTimeline
} from '../controllers/activityController.js';
import { protect, superAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and superadmin role
router.use(protect);
router.use(superAdmin);

// Admin management routes
router.post('/create-admin', createAdmin);           // Create new admin
router.get('/admins', getAllAdmins);                 // Get all admins
router.put('/admins/:id', updateAdmin);              // Update admin
router.delete('/admins/:id', deleteAdmin);           // Delete admin

// Role assignment
router.put('/users/:id/assign-role', assignRoleToUser);  // Assign role to user
router.get('/users/:id/permissions', getUserPermissions); // Get user permissions

// Admin Activity Tracking Routes
router.get('/activities', getAllActivities);                    // Get all admin activities
router.get('/activities/stats', getActivityStats);              // Get activity statistics
router.get('/activities/timeline', getActivityTimeline);        // Get activity timeline
router.get('/activities/admin/:adminId', getAdminActivities);   // Get specific admin activities
router.get('/activities/sessions/:adminId', getAdminSessions);  // Get admin login/logout sessions

export default router;
