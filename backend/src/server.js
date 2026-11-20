
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import api from './routes/api.js';
import { NetworkLog } from './models/index.js';

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || 'http://localhost:5173'
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Request ID
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });

  // Security headers
  app.use(helmet());

  // CORS Configuration
  app.use(cors({
    origin: allowedOrigins,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],
    credentials: false
  }));

  // JSON Middleware
  app.use(express.json({ limit: '120kb' }));

  // Rate Limiting
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  }));

  // Network Logging
  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      if (req.path !== '/api/network/logs') {
        NetworkLog.create({
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - startedAt,
          failed: res.statusCode >= 400
        }).catch(() => {});
      }
    });

    next();
  });

  // Health Check
  app.get('/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'unavailable',
      database: connected ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      requestId: req.requestId
    });
  });

  // API Routes
  app.use('/api', api);

  // Error Handler
  app.use((err, req, res, _next) => {
    const status =
      Number.isInteger(err.status) &&
      err.status >= 400 &&
      err.status < 500
        ? err.status
        : 500;

    if (status >= 500) {
      console.error(
        `Request ${req.requestId} failed with an internal error.`
      );
    }

    const error =
      status === 400 && err.type === 'entity.parse.failed'
        ? 'Malformed JSON request body.'
        : status === 413 || err.type === 'entity.too.large'
          ? 'Request body exceeds the 120 KB limit.'
          : status >= 500
            ? 'Internal server error.'
            : 'Request could not be processed.';

    res.status(status).json({
      error,
      requestId: req.requestId
    });
  });

  return app;
}

// Start Server
export async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required.');
  }

  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      'JWT_SECRET must contain at least 32 characters.'
    );
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log('MongoDB connected successfully.');

  const app = createApp();

  const port = process.env.PORT || 5000;

  return app.listen(port, () => {
    console.log(`CodeSyntax API listening on ${port}`);
  });
}

// Run Server
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  startServer().catch((error) => {
    console.error(
      `CodeSyntax could not start: ${error.message}`
    );

    process.exitCode = 1;
  });
}
