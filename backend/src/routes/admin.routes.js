import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  updateUserQuota,
  forceLogoutUser,
  deleteUser,
  getUserVaultFiles,
} from '../controllers/admin.controller.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require JWT auth AND Admin role
router.use(protect, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/users/:id/files', getUserVaultFiles);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/quota', updateUserQuota);
router.post('/users/:id/logout', forceLogoutUser);
router.delete('/users/:id', deleteUser);

export default router;
