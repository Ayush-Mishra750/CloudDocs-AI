import express from 'express';
import multer from 'multer';
import {
  register,
  login,
  googleAuth,
  getGoogleConfig,
  logout,
  getMe,
  sendOTP,
  verifyOTP,
  updateProfile,
  uploadAvatar,
  setPassword,
  logoutAll,
  disableAccount,
  deleteAccount,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max for avatars
});

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/google/config', getGoogleConfig);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Settings & Profile Management Routes
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/set-password', protect, setPassword);
router.post('/logout-all', protect, logoutAll);
router.post('/disable-account', protect, disableAccount);
router.delete('/delete-account', protect, deleteAccount);

export default router;
