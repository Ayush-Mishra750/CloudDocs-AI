import express from 'express';
import {
  getSubscriptionPlans,
  createRazorpayOrder,
  verifyPayment,
  cancelSubscription,
} from '../controllers/subscription.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All subscription routes are protected with JWT auth
router.use(protect);

router.get('/plans', getSubscriptionPlans);
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);
router.post('/cancel', cancelSubscription);

export default router;
