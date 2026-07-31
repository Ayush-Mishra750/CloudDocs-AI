import express from 'express';
import multer from 'multer';
import {
  getUploadPresignedUrl,
  confirmUpload,
  uploadDirectFile,
  createFolder,
  getUserFiles,
  getFileById,
  deleteFile,
  renameFile,
  toggleStarFile,
  trashFile,
  restoreFile,
  createOrUpdateShareLink,
  revokeShareLink,
  getSharedFile,
  getSharingDashboardMetrics,
  getFilesSharedByMe,
  getFilesSharedWithMe,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  getRegisteredUsersForInvite,
  importFromGoogleDrive,
} from '../controllers/file.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route: Access shared file via shareToken (No auth required)
router.get('/share/:shareToken', getSharedFile);

// Multer in-memory storage config (max 100MB per file for fallback upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max per file upload
});

// All routes below are protected with JWT auth
router.use(protect);

// File Sharing Dashboard & Collaborators Routes
router.get('/sharing/dashboard', getSharingDashboardMetrics);
router.get('/sharing/shared-by-me', getFilesSharedByMe);
router.get('/sharing/shared-with-me', getFilesSharedWithMe);
router.get('/users/collaborators', getRegisteredUsersForInvite);

router.post('/upload-url', getUploadPresignedUrl);
router.post('/confirm-upload', confirmUpload);
router.post('/upload', upload.single('file'), uploadDirectFile);
router.post('/import-google-drive', importFromGoogleDrive);
router.post('/folder', createFolder);
router.get('/', getUserFiles);
router.get('/:id', getFileById);
router.post('/:id/share', createOrUpdateShareLink);
router.delete('/:id/share', revokeShareLink);
router.post('/:id/invite', inviteCollaborator);
router.delete('/:id/collaborator/:targetUserId', removeCollaborator);
router.patch('/:id/collaborator/:targetUserId', updateCollaboratorRole);
router.patch('/:id/rename', renameFile);
router.patch('/:id/star', toggleStarFile);
router.patch('/:id/trash', trashFile);
router.patch('/:id/restore', restoreFile);
router.delete('/:id', deleteFile);

export default router;
