import { cleanEnv, str, port, url } from 'envalid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 5000 }),
  MONGO_URI: str({ default: 'mongodb://mongo:27017/clouddocs' }),
  REDIS_URL: str({ default: 'redis://redis:6379' }),
  CLIENT_URL: url({ default: 'http://localhost:5173' }),
  LOG_LEVEL: str({
    choices: ['error', 'warn', 'info', 'http', 'debug'],
    default: 'info',
  }),
  JWT_SECRET: str({ default: 'clouddocs_jwt_secret_dev_key_12345' }),
  JWT_EXPIRES_IN: str({ default: '7d' }),
  GOOGLE_CLIENT_ID: str({ default: '' }),
  GOOGLE_CLIENT_SECRET: str({ default: '' }),
  RESEND_API_KEY: str({ default: '' }),
  AWS_REGION: str({ default: 'us-east-1' }),
  AWS_ACCESS_KEY_ID: str({ default: '' }),
  AWS_SECRET_ACCESS_KEY: str({ default: '' }),
  AWS_S3_BUCKET_NAME: str({ default: 'clouddocs-storage-bucket' }),
  AWS_CLOUDFRONT_DOMAIN: str({ default: '' }),
  RAZORPAY_KEY_ID: str({ default: '' }),
  RAZORPAY_KEY_SECRET: str({ default: '' }),
  GEMINI_API_KEY: str({ default: '' }),
  GEMINI_MODEL: str({ default: 'gemini-1.5-pro' }),
  GEMINI_EMBEDDING_MODEL: str({ default: 'models/embedding-001' }),
  AI_FEATURES_ENABLED: str({ default: 'true' }),
  AI_MAX_REQUESTS_PER_USER_PER_HOUR: str({ default: '50' }),
});

export default env;
