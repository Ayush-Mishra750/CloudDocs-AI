import express from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import fileRoutes from './file.routes.js';
import adminRoutes from './admin.routes.js';
import subscriptionRoutes from './subscription.routes.js';

const router = express.Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/admin', adminRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
