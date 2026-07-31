import { getMongoStatus } from '../config/db.js';
import { getRedisStatus } from '../config/redis.js';

export const getHealthStatus = async (req, res, next) => {
  try {
    const mongoStatus = getMongoStatus();
    const redisStatus = await getRedisStatus();

    const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';

    res.status(200).json({
      status: isHealthy ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        mongo: mongoStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
