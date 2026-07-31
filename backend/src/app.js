import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import logger from './utils/logger.js';
import apiRoutes from './routes/index.js';
import notFound from './middlewares/notFound.middleware.js';
import errorHandler from './middlewares/errorHandler.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware (configured to allow cross-origin requests in dev)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Bulletproof CORS setup allowing full credentials & origins
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsing & Cookie parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static uploads serving for local dev fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// HTTP Request logging
app.use(morgan('combined', { stream: logger.stream }));

// API Routes
app.use('/api/v1', apiRoutes);

// Root route welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CloudDocs AI API',
    version: '1.0.0',
    healthCheck: '/api/v1/health',
  });
});

// 404 & Global Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
