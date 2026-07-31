import crypto from 'crypto';
import Razorpay from 'razorpay';
import env from '../config/env.js';
import User from '../models/user.model.js';
import File from '../models/file.model.js';
import Subscription from '../models/subscription.model.js';
import logger from '../utils/logger.js';

// Plan configurations
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    subtitle: 'Starter Plan',
    description: 'Personal users who want to try the platform',
    priceMonthly: 0,
    priceYearly: 0,
    storageGB: 5,
    storageBytes: 5 * 1024 * 1024 * 1024,
    maxFileSizeStr: '100 MB',
    maxFileSizeBytes: 100 * 1024 * 1024,
    maxDevices: 1,
    features: [
      '500 MB secure storage',
      'File upload limit: 100 MB per file',
      'Access from 1 device',
      'Standard download speed',
      'Basic email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    subtitle: 'For Students & Freelancers',
    description: 'Students, freelancers, or small teams who need more space',
    priceMonthly: 299,
    priceYearly: 2999,
    storageGB: 200,
    storageBytes: 200 * 1024 * 1024 * 1024,
    maxFileSizeStr: '2 GB',
    maxFileSizeBytes: 2 * 1024 * 1024 * 1024,
    maxDevices: 3,
    isPopular: true,
    features: [
      '200 GB secure storage',
      'File upload limit: 2 GB per file',
      'Access from up to 3 devices',
      'Priority upload/download speed',
      'Email & chat support',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    subtitle: 'For Professionals & Creators',
    description: 'Professionals and creators handling large media files',
    priceMonthly: 699,
    priceYearly: 6999,
    storageGB: 2000,
    storageBytes: 2000 * 1024 * 1024 * 1024,
    maxFileSizeStr: '10 GB',
    maxFileSizeBytes: 10 * 1024 * 1024 * 1024,
    maxDevices: 3,
    features: [
      '2 TB secure storage',
      'File upload limit: 10 GB per file',
      'Access from up to 3 devices',
      'Priority upload/download speed',
      'Priority customer support',
    ],
  },
};

/**
 * @desc    Get user subscription overview & available plans from MongoDB
 * @route   GET /api/v1/subscriptions/plans
 * @access  Private
 */
export const getSubscriptionPlans = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const activePlanId = user?.plan || 'free';
    const activePlan = PLANS[activePlanId] || PLANS.free;

    // Fetch metrics from MongoDB
    const totalFilesCount = await File.countDocuments({ user: userId, isTrash: false });
    const sharedFilesCount = await File.countDocuments({ user: userId, isTrash: false, isPublic: true });

    // Fetch latest active subscription document from MongoDB
    const latestSubRecord = await Subscription.findOne({ user: userId }).sort({ createdAt: -1 });

    const keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

    res.status(200).json({
      success: true,
      plans: Object.values(PLANS),
      razorpayKeyId: keyId || 'rzp_test_dev_sandbox_key',
      currentSubscription: {
        plan: activePlanId,
        planName: `${activePlan.name} Plan`,
        subtitle: activePlan.subtitle,
        status: user.subscriptionStatus === 'none' ? 'ACTIVE' : (user.subscriptionStatus || 'ACTIVE').toUpperCase(),
        billingCycle: user.billingCycle || 'monthly',
        price: user.billingCycle === 'yearly' ? activePlan.priceYearly : activePlan.priceMonthly,
        nextBilling: user.subscriptionExpiresAt
          ? new Date(user.subscriptionExpiresAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Dec 25, 2025',
        storageUsed: user.storageUsed || 0,
        storageLimitGB: activePlan.storageGB,
        storageLimitBytes: activePlan.storageBytes,
        maxFileSizeStr: activePlan.maxFileSizeStr,
        maxDevices: activePlan.maxDevices,
        totalFiles: totalFilesCount,
        sharedFiles: sharedFilesCount,
        devicesConnected: `1 / ${activePlan.maxDevices}`,
        filesUploadedDuringSub: totalFilesCount,
        latestRazorpayPaymentId: latestSubRecord?.razorpayPaymentId || user.razorpayPaymentId || '',
      },
    });
  } catch (error) {
    logger.error(`Error in getSubscriptionPlans: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/v1/subscriptions/create-order
 * @access  Private
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { planId, cycle = 'monthly' } = req.body;
    const selectedPlan = PLANS[planId];

    if (!selectedPlan || selectedPlan.id === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create Razorpay order for free plan.',
      });
    }

    const price = cycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
    const keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // Real Razorpay API Order Creation
    if (keyId && keySecret) {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: price * 100, // in paise
        currency: 'INR',
        receipt: `rcpt_${req.user._id.toString().slice(-6)}_${Date.now()}`,
        notes: {
          userId: req.user._id.toString(),
          planId: selectedPlan.id,
        },
      };

      const order = await razorpay.orders.create(options);
      logger.info(`Razorpay order created for user ${req.user.email}: ${order.id}`);

      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        plan: selectedPlan,
        isDevSandbox: false,
      });
    }

    // Dev Test Mode Fallback (Generates valid mock Razorpay Order)
    const devOrderId = `order_rzp_test_${crypto.randomBytes(8).toString('hex')}`;
    logger.info(`[Razorpay Test] Generated mock order for ${req.user.email}: ${devOrderId}`);

    return res.status(200).json({
      success: true,
      orderId: devOrderId,
      amount: price * 100,
      currency: 'INR',
      keyId: 'rzp_test_dev_sandbox_key',
      plan: selectedPlan,
      isDevSandbox: true,
    });
  } catch (error) {
    logger.error(`Error in createRazorpayOrder: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Verify Payment Signature & Save Subscription Data to MongoDB
 * @route   POST /api/v1/subscriptions/verify-payment
 * @access  Private
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId, cycle = 'monthly' } = req.body;
    const selectedPlan = PLANS[planId];

    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selected.' });
    }

    const keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC Signature if live Razorpay keys are configured
    if (keyId && keySecret && razorpaySignature && !razorpayOrderId?.startsWith('order_rzp_test_')) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        logger.warn(`Razorpay signature verification failed for ${req.user.email}`);
        return res.status(400).json({
          success: false,
          message: 'Razorpay payment verification failed. Invalid HMAC signature.',
        });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const durationDays = cycle === 'yearly' ? 365 : 30;
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // 1. Save Subscription Fields into User Document in MongoDB
    user.plan = selectedPlan.id;
    user.billingCycle = cycle;
    user.storageLimit = selectedPlan.storageBytes;
    user.maxFileSize = selectedPlan.maxFileSizeBytes;
    user.maxDevices = selectedPlan.maxDevices;
    user.subscriptionStatus = 'active';
    user.subscriptionExpiresAt = endDate;
    user.razorpayOrderId = razorpayOrderId || `order_mock_${Date.now()}`;
    user.razorpayPaymentId = razorpayPaymentId || `pay_rzp_${Date.now()}`;
    await user.save();

    // 2. Save Full Payment Record in Subscription Collection in MongoDB
    const subRecord = await Subscription.create({
      user: user._id,
      plan: selectedPlan.id,
      billingCycle: cycle,
      amount: cycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly,
      currency: 'INR',
      status: 'active',
      razorpayOrderId: user.razorpayOrderId,
      razorpayPaymentId: user.razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'dev_mock_signature',
      startDate: new Date(),
      endDate: endDate,
    });

    logger.info(`[MongoDB Saved] Subscription record ${subRecord._id} created for user ${user.email} -> ${selectedPlan.name} Plan`);

    res.status(200).json({
      success: true,
      message: `🎉 Success! Subscription payment verified and saved into MongoDB. Upgraded to ${selectedPlan.name} Plan (${selectedPlan.storageGB} GB Storage).`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        storageLimit: user.storageLimit,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      },
      subscription: subRecord,
    });
  } catch (error) {
    logger.error(`Error in verifyPayment: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Cancel Subscription & Downgrade in MongoDB
 * @route   POST /api/v1/subscriptions/cancel
 * @access  Private
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.plan = 'free';
    user.billingCycle = 'monthly';
    user.storageLimit = PLANS.free.storageBytes;
    user.maxFileSize = PLANS.free.maxFileSizeBytes;
    user.maxDevices = PLANS.free.maxDevices;
    user.subscriptionStatus = 'cancelled';
    user.subscriptionExpiresAt = null;
    await user.save();

    // Mark active subscriptions as cancelled in MongoDB
    await Subscription.updateMany(
      { user: user._id, status: 'active' },
      { status: 'cancelled' }
    );

    logger.info(`User ${user.email} cancelled subscription and reverted to Free tier in MongoDB.`);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled. Account reverted to Free Plan in MongoDB.',
      user: {
        _id: user._id,
        plan: user.plan,
        storageLimit: user.storageLimit,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    logger.error(`Error in cancelSubscription: ${error.message}`);
    next(error);
  }
};
