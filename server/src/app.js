import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { getDatabaseInfo } from './config/db.js';

dotenv.config();

const app = express();

// Permissive CORS configuration supporting iframe embeds, previews, and direct domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== 'null') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Health & Status Endpoints
// Root health-check route
app.get('/', (req, res, next) => {
  // If the request accepts HTML (browser navigation loading the app UI), pass to frontend SPA
  const isHtmlRequest =
    req.headers['sec-fetch-dest'] === 'document' ||
    (req.headers.accept && req.headers.accept.includes('text/html'));

  if (isHtmlRequest) {
    return next();
  }

  // If requested by an API client, curl, automated test, or health checker:
  res.status(200).json({
    success: true,
    message: 'NOVA API is running'
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NOVA API is running'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NOVA API is running'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    success: true,
    message: 'NOVA API is running',
    service: 'NOVA Backend REST API',
    version: '1.0.0',
    database: getDatabaseInfo(),
    timestamp: new Date().toISOString()
  });
});

// Mount Core REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);

// Error Handling Middlewares for API routes
app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;
