import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeAppInsights } from './config/appInsights';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import todoRoutes from './routes/todoRoutes';
import healthRoutes from './routes/healthRoutes';
import chaosRoutes from './routes/chaosRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';

// Load environment variables
dotenv.config();

// Initialize Application Insights
initializeAppInsights();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/chaos', chaosRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ message: 'SRE Demo API is running!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔍 Application Insights: ${process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ? 'Enabled' : 'Disabled'}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('🛑 Received shutdown signal, closing server...');
  
  server.close(async () => {
    logger.info('✅ HTTP server closed');
    
    // Close database connections
    const { prisma } = await import('./config/database');
    await prisma.$disconnect();
    logger.info('✅ Database connections closed');
    
    // Close Redis connections
    const { redisClient } = await import('./config/redis');
    await redisClient.quit();
    logger.info('✅ Redis connections closed');
    
    logger.info('👋 Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Don't exit in production, let monitoring catch it
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Exit process as the app is in an undefined state
  process.exit(1);
});

export default app;
