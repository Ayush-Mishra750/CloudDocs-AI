import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const region = env.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const accessKeyId = env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || 'clouddocs-storage-bucket';

const isConfigured = Boolean(accessKeyId && secretAccessKey);
let s3Client = null;
if (isConfigured) {
  s3Client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

/**
 * Download file bytes from S3 or local uploads fallback
 */
export const downloadFileBuffer = async (s3Key) => {
  try {
    if (!isConfigured || !s3Client) {
      const localFileName = s3Key.replace(/\//g, '_');
      const localFilePath = path.join(uploadsDir, localFileName);
      if (fs.existsSync(localFilePath)) {
        return fs.readFileSync(localFilePath);
      }
      throw new Error(`Local file not found at ${localFilePath}`);
    }

    const command = new GetObjectCommand({ Bucket: bucketName, Key: s3Key });
    const response = await s3Client.send(command);

    const streamToBuffer = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });

    return await streamToBuffer(response.Body);
  } catch (error) {
    logger.error(`Error downloading file buffer for key ${s3Key}: ${error.message}`);
    throw error;
  }
};
