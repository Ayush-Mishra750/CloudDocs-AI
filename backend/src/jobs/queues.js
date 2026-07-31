import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';

const connection = getRedisClient();

export const aiDocumentQueue = new Queue('ai-document-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export const aiOrganizerQueue = new Queue('ai-file-organizer', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
    removeOnComplete: true,
  },
});
