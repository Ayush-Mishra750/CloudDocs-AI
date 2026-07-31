import api from './axiosInstance';

/**
 * Get subscription plans and current active subscription status from MongoDB
 */
export const getSubscriptionPlansApi = async () => {
  const response = await api.get('/subscriptions/plans');
  return response.data;
};

/**
 * Create Razorpay Order
 */
export const createRazorpayOrderApi = async (planId, cycle = 'monthly') => {
  const response = await api.post('/subscriptions/create-order', { planId, cycle });
  return response.data;
};

/**
 * Verify Razorpay Payment Signature and save subscription to MongoDB
 */
export const verifyPaymentApi = async (paymentDetails) => {
  const response = await api.post('/subscriptions/verify-payment', paymentDetails);
  return response.data;
};

/**
 * Cancel active subscription & revert to free plan in MongoDB
 */
export const cancelSubscriptionApi = async () => {
  const response = await api.post('/subscriptions/cancel');
  return response.data;
};
