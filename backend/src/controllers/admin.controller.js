import mongoose from 'mongoose';
import User from '../models/user.model.js';
import File from '../models/file.model.js';
import logger from '../utils/logger.js';
import { deleteS3Object } from '../utils/s3.js';

// Helper to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Helper to safely parse parentFolder ObjectId
const parseParentFolder = (folderId) => {
  if (
    folderId &&
    folderId !== 'null' &&
    folderId !== 'undefined' &&
    folderId !== 'root' &&
    mongoose.Types.ObjectId.isValid(folderId)
  ) {
    return folderId;
  }
  return null;
};

/**
 * @desc    Get global system statistics overview
 * @route   GET /api/v1/admin/stats
 * @access  Private/Admin
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isDisabled: false, isDeleted: { $ne: true } });
    const onlineUsers = await User.countDocuments({ isLoggedIn: true, isDeleted: { $ne: true } });
    const deletedUsers = await User.countDocuments({ isDeleted: true });

    const totalFiles = await File.countDocuments({ isFolder: false });
    const totalFolders = await File.countDocuments({ isFolder: true });
    const totalPublicShares = await File.countDocuments({ isPublic: true });

    const storageAgg = await User.aggregate([
      { $group: { _id: null, totalStorageUsed: { $sum: '$storageUsed' } } },
    ]);
    const totalStorageUsed = storageAgg.length > 0 ? storageAgg[0].totalStorageUsed : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        onlineUsers,
        deletedUsers,
        totalFiles,
        totalFolders,
        totalPublicShares,
        totalStorageUsed,
        formattedTotalStorageUsed: formatBytes(totalStorageUsed),
      },
    });
  } catch (error) {
    logger.error(`Error in getAdminStats: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all users list with search & pagination
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      users: users.map((u) => ({
        ...u.toObject(),
        formattedUsed: formatBytes(u.storageUsed),
        formattedLimit: formatBytes(u.storageLimit),
      })),
    });
  } catch (error) {
    logger.error(`Error in getAllUsers: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update user role (user <-> admin)
 * @route   PATCH /api/v1/admin/users/:id/role
 * @access  Private/Admin
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.role = role;
    await targetUser.save();

    logger.info(`Admin ${req.user.email} updated role of ${targetUser.email} to ${role}`);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    logger.error(`Error in updateUserRole: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Force logout user
 * @route   POST /api/v1/admin/users/:id/logout
 * @access  Private/Admin
 */
export const forceLogoutUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.isLoggedIn = false;
    await targetUser.save();

    logger.info(`Admin ${req.user.email} forced logout for user ${targetUser.email}`);

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} has been logged out.`,
    });
  } catch (error) {
    logger.error(`Error in forceLogoutUser: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update user storage quota limit
 * @route   PATCH /api/v1/admin/users/:id/quota
 * @access  Private/Admin
 */
export const updateUserQuota = async (req, res, next) => {
  try {
    const { storageLimitGB } = req.body;
    if (!storageLimitGB || Number(storageLimitGB) <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid storage limit in GB.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newLimitBytes = Number(storageLimitGB) * 1024 * 1024 * 1024;
    targetUser.storageLimit = newLimitBytes;
    await targetUser.save();

    logger.info(`Admin ${req.user.email} updated storage limit for ${targetUser.email} to ${storageLimitGB} GB`);

    res.status(200).json({
      success: true,
      message: `Storage limit updated to ${storageLimitGB} GB.`,
      user: {
        _id: targetUser._id,
        email: targetUser.email,
        storageLimit: targetUser.storageLimit,
        formattedLimit: formatBytes(targetUser.storageLimit),
      },
    });
  } catch (error) {
    logger.error(`Error in updateUserQuota: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete their own account.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete all user files from S3/disk & database
    const userFiles = await File.find({ user: targetUser._id });
    for (const f of userFiles) {
      if (!f.isFolder && f.s3Key) {
        await deleteS3Object(f.s3Key);
      }
    }
    await File.deleteMany({ user: targetUser._id });

    // Delete user from DB
    await targetUser.deleteOne();

    logger.info(`Admin ${req.user.email} deleted user ${targetUser.email} and purged all their files.`);

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} and all associated files purged successfully.`,
    });
  } catch (error) {
    logger.error(`Error in deleteUser: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Inspect target user's vault files & directories (Single User View)
 * @route   GET /api/v1/admin/users/:id/files
 * @access  Private/Admin
 */
export const getUserVaultFiles = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id).select('name email role avatar storageUsed storageLimit');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { parentFolder } = req.query;
    const parentId = parseParentFolder(parentFolder);

    const directories = await File.find({
      user: targetUser._id,
      isFolder: true,
      parentFolder: parentId,
      isTrash: { $ne: true },
    }).sort({ name: 1 });

    const files = await File.find({
      user: targetUser._id,
      isFolder: false,
      parentFolder: parentId,
      isTrash: { $ne: true },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user: targetUser,
      directories: directories.map((d) => ({
        _id: d._id,
        name: d.name,
        isFolder: true,
        mimeType: 'folder',
        createdAt: d.createdAt,
      })),
      files: files.map((f) => ({
        _id: f._id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        formattedSize: formatBytes(f.size),
        isFolder: false,
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    logger.error(`Error in getUserVaultFiles: ${error.message}`);
    next(error);
  }
};
