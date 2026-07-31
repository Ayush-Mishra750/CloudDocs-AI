import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
// AI background workers disabled as per configuration
// import './jobs/workers/aiDocument.worker.js';
// import './jobs/workers/aiOrganizer.worker.js';

const startServer = async () => {
  try {
    logger.info(`Initializing CloudDocs AI Backend [${env.NODE_ENV}]...`);

    // Start Express server
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Initialize Redis connection
    initRedis();

    // Connect to MongoDB
    connectDB();

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
