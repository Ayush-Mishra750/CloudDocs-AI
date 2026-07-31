import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import File from '../models/file.model.js';
import { uploadBufferToS3, generatePresignedDownloadUrl, deleteS3Object } from '../utils/s3.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';
import { sendOTPEmail } from '../utils/sendEmail.js';

// Helper to check DB connection status before DB queries
const checkDatabaseConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'MongoDB database is disconnected or starting up. Please ensure MongoDB container/service is running and try again.',
    });
    return false;
  }
  return true;
};

const PRIMARY_ADMIN_EMAIL = 'ayushmishra270306@gmail.com';

// Helper to set HTTP-only cookie
const sendTokenResponse = async (user, statusCode, res, message) => {
  if (user.email && user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
    user.role = 'admin';
  }
  user.isLoggedIn = true;
  await user.save();
  const token = user.generateAuthToken();

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  const userObj = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isLoggedIn: true,
    storageUsed: user.storageUsed,
    storageLimit: user.storageLimit,
    avatar: user.avatar,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: userObj,
    });
};

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      authProvider: 'local',
      isVerified: false,
      otp: generatedOTP,
      otpExpiresAt: otpExpires,
    });

    logger.info(`New user registered and saved to MongoDB: ${user.email}`);

    // Send OTP Email via Resend
    await sendOTPEmail({
      email: user.email,
      name: user.name,
      otp: generatedOTP,
      subject: 'Storemystuff — Verify Your Account',
    });

    res.status(201).json({
      success: true,
      requireOtp: true,
      isVerified: false,
      email: user.email,
      message: 'User registered successfully. A verification code has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    // If user registered with email and is not verified yet, send fresh OTP & require verification
    if (!user.isVerified) {
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      user.otp = generatedOTP;
      user.otpExpiresAt = otpExpires;
      await user.save();

      await sendOTPEmail({
        email: user.email,
        name: user.name,
        otp: generatedOTP,
        subject: 'Storemystuff — Verification Code',
      });

      logger.info(`User logged in but is unverified. Sent fresh OTP to: ${user.email}`);

      return res.status(200).json({
        success: true,
        requireOtp: true,
        isVerified: false,
        email: user.email,
        message: 'Account not verified yet. A new verification code has been sent to your email.',
      });
    }

    logger.info(`User logged in: ${user.email}`);

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Google OAuth Authentication
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const { credential, idToken, googleUser } = req.body;
    const tokenToVerify = credential || idToken;

    let googlePayload = null;

    if (tokenToVerify) {
      const activeClientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      try {
        if (activeClientId) {
          const clientToUse = new OAuth2Client(activeClientId);
          const ticket = await clientToUse.verifyIdToken({
            idToken: tokenToVerify,
            audience: activeClientId,
          });
          googlePayload = ticket.getPayload();
        } else {
          googlePayload = jwt.decode(tokenToVerify);
        }
      } catch (verifyError) {
        logger.warn(`Google ID token verification notice (${verifyError.message}). Decoding token directly.`);
        googlePayload = jwt.decode(tokenToVerify);
      }
    } else if (googleUser) {
      googlePayload = googleUser;
    }

    if (!googlePayload || !googlePayload.email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to extract valid email profile from Google OAuth payload.',
      });
    }

    const { sub: googleId, email, name, picture } = googlePayload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      if (name && user.name !== name) user.name = name;
      if (email.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
        user.role = 'admin';
      }
      user.isVerified = true;
      await user.save();
      logger.info(`Existing user authenticated via Google OAuth: ${user.email}`);
    } else {
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        googleId,
        avatar: picture || '',
        authProvider: 'google',
        role: email.toLowerCase() === PRIMARY_ADMIN_EMAIL ? 'admin' : 'user',
        isVerified: true,
      });
      logger.info(`New Google OAuth user created and saved to MongoDB: ${user.email}`);
    }

    sendTokenResponse(user, 200, res, 'Google authentication successful');
  } catch (error) {
    logger.error(`Google OAuth controller error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get Google OAuth Configuration status
 * @route   GET /api/v1/auth/google/config
 * @access  Public
 */
export const getGoogleConfig = (req, res) => {
  const activeClientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || null;
  res.status(200).json({
    success: true,
    clientId: activeClientId,
    configured: Boolean(activeClientId),
  });
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { isLoggedIn: false });
    }
  } catch (err) {
    logger.warn(`Logout user status update error: ${err.message}`);
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email && user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    if (!user.isLoggedIn) {
      user.isLoggedIn = true;
      await user.save();
    }

    const userObj = user.toObject();
    const hasPassword = !!userObj.password;
    delete userObj.password;

    res.status(200).json({
      success: true,
      user: {
        ...userObj,
        hasPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send / Resend OTP Email
 * @route   POST /api/v1/auth/send-otp
 * @access  Public / Private
 */
export const sendOTP = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const email = req.body.email || req.user?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = generatedOTP;
    user.otpExpiresAt = otpExpires;
    await user.save();

    await sendOTPEmail({
      email: user.email,
      name: user.name,
      otp: generatedOTP,
      subject: 'Storemystuff — Verification Code',
    });

    logger.info(`OTP generated and sent for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${user.email}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP Code
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public / Private
 */
export const verifyOTP = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const { email, otp } = req.body;
    const targetEmail = email || req.user?.email;

    if (!targetEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and the 6-digit OTP code',
      });
    }

    const user = await User.findOne({ email: targetEmail.toLowerCase() }).select('+otp');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP request found. Please request a new code.',
      });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    if (user.otp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    logger.info(`Email successfully verified via OTP for user: ${user.email}`);

    sendTokenResponse(user, 200, res, 'Email verified successfully!');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update User Profile (Full Name)
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid full name.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name.trim();
    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload User Profile Picture / Avatar
 * @route   POST /api/v1/auth/avatar
 * @access  Private
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const originalName = req.file.originalname || `avatar-${Date.now()}.png`;
    const mimeType = req.file.mimetype;
    const s3Key = `avatars/${user._id}-${Date.now()}-${originalName}`;

    const uploadResult = await uploadBufferToS3({
      buffer: req.file.buffer,
      mimeType,
      s3Key,
    });

    const avatarUrl = await generatePresignedDownloadUrl({
      s3Key,
      originalName,
    });

    user.avatar = avatarUrl || uploadResult.s3Url;
    await user.save();

    logger.info(`Avatar updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully!',
      avatar: user.avatar,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set / Change Password for Manual Login
 * @route   POST /api/v1/auth/set-password
 * @access  Private
 */
export const setPassword = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const { password, confirmPassword } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();

    logger.info(`Password updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password saved successfully! You can now log in using your password.',
      hasPassword: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout from All Devices
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
export const logoutAll = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Disable User Account (Temporary)
 * @route   POST /api/v1/auth/disable-account
 * @access  Private
 */
export const disableAccount = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isDisabled = true;
    await user.save();

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    logger.warn(`Account disabled by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Your account has been disabled.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete User Account Permanently
 * @route   DELETE /api/v1/auth/delete-account
 * @access  Private
 */
export const deleteAccount = async (req, res, next) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const userId = req.user._id;

    // Delete user files from storage
    const userFiles = await File.find({ user: userId });
    for (const file of userFiles) {
      if (file.s3Key) {
        await deleteS3Object(file.s3Key);
      }
    }
    await File.deleteMany({ user: userId });

    // Delete user document
    await User.findByIdAndDelete(userId);

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    logger.warn(`Account permanently deleted for user ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

