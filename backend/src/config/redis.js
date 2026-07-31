import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis server successfully.');
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis connection error: ${err.message}`);
    });
  }
  return redisClient;
};

export const initRedis = () => getRedisClient();

export const getRedisStatus = async () => {
  try {
    const client = getRedisClient();
    if (client && (client.status === 'ready' || client.status === 'connect')) {
      await client.ping();
      return 'connected';
    }
    return 'disconnected';
  } catch (err) {
    return 'disconnected';
  }
};

export default getRedisClient;
