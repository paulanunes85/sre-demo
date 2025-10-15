import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { trackException } from '../config/appInsights';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Track exception in Application Insights
  trackException(err, {
    path: req.path,
    method: req.method,
    ip: req.ip || 'unknown',
  });

  // Log error
  logger.error('Error handled:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // INTENTIONAL BUG (Scenario 9): In development, expose full error details
  // This is a security risk and should be avoided in production
  if (process.env.NODE_ENV === 'development' && process.env.CHAOS_MISSING_ERROR_HANDLING_ENABLED === 'true') {
    res.status(statusCode).json({
      error: err.message,
      stack: err.stack,
      // SECURITY RISK: Exposing sensitive information
      database: process.env.DATABASE_URL,
      redis: process.env.REDIS_CONNECTION_STRING,
      environment: process.env.NODE_ENV,
      path: req.path,
      body: req.body,
    });
    return;
  }

  // Production error response
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    requestId: req.id,
  });
};
