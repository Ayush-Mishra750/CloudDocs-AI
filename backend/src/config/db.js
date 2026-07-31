import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

let isConnected = false;

export const connectDB = async (retryCount = 0) => {
  const maxRetries = 10;
  const baseDelayMs = 1000;

  // Fallback URI list for Docker vs Local execution
  const urisToTry = [
    env.MONGO_URI,
    'mongodb://mongo:27017/clouddocs',
    'mongodb://127.0.0.1:27017/clouddocs',
    'mongodb://localhost:27017/clouddocs',
  ];

  const targetUri = urisToTry[retryCount % urisToTry.length] || env.MONGO_URI;

  try {
    mongoose.set('strictQuery', true);
    // Disable command buffering so queries fail fast with clear errors if DB is offline
    mongoose.set('bufferCommands', false);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }

    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    logger.info(`MongoDB connected successfully to ${targetUri}`);
    return true;
  } catch (error) {
    isConnected = false;
    logger.error(`MongoDB connection failed on ${targetUri} (attempt ${retryCount + 1}/${maxRetries}): ${error.message}`);

    if (retryCount < maxRetries - 1) {
      const delay = baseDelayMs * Math.min(retryCount + 1, 3);
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      return await connectDB(retryCount + 1);
    } else {
      logger.error('MongoDB max retries reached.');
      return false;
    }
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB connection lost!');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB connection re-established!');
});

export const getMongoStatus = () => {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};
