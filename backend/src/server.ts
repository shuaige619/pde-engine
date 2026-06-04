import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { createApp } from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Start the server
 */
function startServer(): void {
  const app = createApp();

  const server = app.listen(Number(PORT), HOST, () => {
    logger.info(`Server is running on http://${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string): void => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
      logger.info('Server closed. Process terminated.');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection:', { reason });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

startServer();
