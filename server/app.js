import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import peopleRoutes from './routes/peopleRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { securityHeaders, getCorsOptions } from './middleware/securityMiddleware.js';
import { apiLimiter, authLimiter } from './middleware/rateLimitMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy (for rate limiting and secure cookies behind Nginx, Render, Vercel)
app.set('trust proxy', 1);

// Security & Parsing Middlewares
app.use(securityHeaders);
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// General API Rate Limiting
app.use('/api', apiLimiter);

// 1. Liveness Health Check (returns process status)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: '🎬 CineVerse Backend API is healthy and running',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 2. Readiness Check (verifies database dependency)
app.get('/api/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;

  if (isDbReady) {
    return res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    success: false,
    status: 'unready',
    database: 'disconnected',
    message: 'MongoDB is connecting or unavailable',
    timestamp: new Date().toISOString(),
  });
});

// API Routes with dedicated auth rate limiter
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve Client Static Build in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for client SPA routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return notFoundHandler(req, res, next);
  }
  const indexPath = path.resolve(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('CineVerse Movie API Server is up! Run "npm run client" for development mode.');
    }
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
