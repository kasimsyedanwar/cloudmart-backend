import app from './app';
import env from './config/env';
import logger from './config/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`CloudMart API is running on port ${env.PORT}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection detected');
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtExpeption', (error) => {
  logger.fatal({ error }, 'Uncaught exeption detected');
  process.exit(1);
});
