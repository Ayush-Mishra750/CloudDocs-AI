import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/env.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const region = env.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const accessKeyId = env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || 'clouddocs-storage-bucket';
const cloudFrontDomain = env.AWS_CLOUDFRONT_DOMAIN || process.env.AWS_CLOUDFRONT_DOMAIN || '';

const isConfigured = Boolean(accessKeyId && secretAccessKey);

let s3Client = null;

if (isConfigured) {
  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  logger.info(`AWS S3 Client initialized for bucket: ${bucketName} in region: ${region}`);
} else {
  logger.warn('AWS S3 credentials not fully configured. Using S3 local storage fallback mode.');
}

const getBackendBaseUrl = () => {
  const port = env.PORT || process.env.PORT || 5000;
  return `http://localhost:${port}`;
};

/**
 * Generate a unique S3 object key for a user file
 */
export const generateS3Key = (userId, originalName) => {
  const fileExtension = originalName && originalName.includes('.')
    ? originalName.substring(originalName.lastIndexOf('.'))
    : '';
  const randomUuid = crypto.randomUUID();
  const sanitizedUserId = userId ? userId.toString() : 'guest';
  return `uploads/${sanitizedUserId}/${randomUuid}${fileExtension}`;
};

/**
 * Generate Presigned Upload URL for direct browser-to-S3 uploads
 */
export const generatePresignedUploadUrl = async ({ s3Key, mimeType, expiresIn = 3600 }) => {
  if (!isConfigured || !s3Client) {
    const backendUrl = getBackendBaseUrl();
    logger.info(`[DEV S3 FALLBACK] Generated upload endpoint for key: ${s3Key}`);
    return {
      uploadUrl: `${backendUrl}/api/v1/files/upload`,
      s3Key,
      isMock: true,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ContentType: mimeType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return { uploadUrl, s3Key, isMock: false };
  } catch (error) {
    logger.error(`Error generating presigned upload URL: ${error.message}`);
    throw error;
  }
};

/**
 * Generate Presigned Download URL or CloudFront CDN URL
 */
export const generatePresignedDownloadUrl = async ({ s3Key, originalName, expiresIn = 3600 }) => {
  if (!s3Key) return null;

  if (cloudFrontDomain) {
    const cleanDomain = cloudFrontDomain.replace(/\/$/, '');
    return `${cleanDomain}/${s3Key}`;
  }

  if (!isConfigured || !s3Client) {
    const localFileName = s3Key.replace(/\//g, '_');
    const localFilePath = path.join(uploadsDir, localFileName);
    if (fs.existsSync(localFilePath)) {
      return `${getBackendBaseUrl()}/uploads/${localFileName}`;
    }
    return `${getBackendBaseUrl()}/uploads/${localFileName}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ResponseContentDisposition: originalName ? `inline; filename="${encodeURIComponent(originalName)}"` : undefined,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    logger.error(`Error generating presigned download URL for key ${s3Key}: ${error.message}`);
    return `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
  }
};

/**
 * Upload a Buffer directly to S3 or local disk fallback
 */
export const uploadBufferToS3 = async ({ buffer, mimeType, s3Key }) => {
  if (!isConfigured || !s3Client) {
    const localFileName = s3Key.replace(/\//g, '_');
    const localFilePath = path.join(uploadsDir, localFileName);
    fs.writeFileSync(localFilePath, buffer);
    const localUrl = `${getBackendBaseUrl()}/uploads/${localFileName}`;
    logger.info(`[DEV S3 FALLBACK] Uploaded buffer (${buffer.length} bytes) to local file: ${localFilePath}`);
    return { s3Key, s3Url: localUrl, isMock: true };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: buffer,
    ContentType: mimeType,
  });

  try {
    await s3Client.send(command);
    const s3Url = cloudFrontDomain
      ? `${cloudFrontDomain.replace(/\/$/, '')}/${s3Key}`
      : `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    return { s3Key, s3Url, isMock: false };
  } catch (error) {
    logger.error(`Failed to upload buffer to S3: ${error.message}`);
    throw error;
  }
};

/**
 * Delete an object from S3 bucket or local disk fallback
 */
export const deleteS3Object = async (s3Key) => {
  if (!isConfigured || !s3Client) {
    const localFileName = s3Key.replace(/\//g, '_');
    const localFilePath = path.join(uploadsDir, localFileName);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        logger.info(`Successfully deleted local file fallback: ${localFilePath}`);
      } catch (e) {
        logger.error(`Failed deleting local file: ${e.message}`);
      }
    }
    return true;
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  try {
    await s3Client.send(command);
    logger.info(`Successfully deleted S3 object key: ${s3Key}`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete S3 object key ${s3Key}: ${error.message}`);
    return false;
  }
};

