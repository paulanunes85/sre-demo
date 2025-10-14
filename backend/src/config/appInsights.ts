import * as appInsights from 'applicationinsights';
import { logger } from '../utils/logger';

export const initializeAppInsights = () => {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    logger.warn('⚠️ Application Insights connection string not found. Monitoring disabled.');
    return null;
  }

  try {
    appInsights
      .setup(connectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, false)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

    appInsights.start();

    logger.info('✅ Application Insights initialized');
    return appInsights.defaultClient;
  } catch (error) {
    logger.error('Failed to initialize Application Insights:', error);
    return null;
  }
};

export const trackEvent = (name: string, properties?: { [key: string]: string }) => {
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackEvent({
      name,
      properties,
    });
  }
};

export const trackMetric = (name: string, value: number) => {
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackMetric({
      name,
      value,
    });
  }
};

export const trackException = (error: Error, properties?: { [key: string]: string }) => {
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackException({
      exception: error,
      properties,
    });
  }
};
