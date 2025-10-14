import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { trackEvent } from '../config/appInsights';

const router = Router();

// Global state for chaos scenarios (not production-ready!)
let chaosState = {
  memoryLeakEnabled: false,
  cpuSpikeEnabled: false,
  dbTimeoutEnabled: false,
  poolExhaustionEnabled: false,
  unhandledPromiseEnabled: false,
};

// Memory leak storage
const memoryLeakStore: any[] = [];

/**
 * SCENARIO 1: Memory Leak
 * Intentionally creates objects that are never garbage collected
 */
router.post('/memory-leak/enable', (req: Request, res: Response) => {
  chaosState.memoryLeakEnabled = true;
  logger.warn('🔥 CHAOS: Memory leak enabled');
  trackEvent('ChaosEnabled', { scenario: 'memory-leak' });
  res.json({ message: 'Memory leak scenario enabled' });
});

router.post('/memory-leak/disable', (req: Request, res: Response) => {
  chaosState.memoryLeakEnabled = false;
  memoryLeakStore.length = 0; // Clear the leak
  logger.info('✅ CHAOS: Memory leak disabled');
  res.json({ message: 'Memory leak scenario disabled' });
});

router.post('/memory-leak/trigger', (req: Request, res: Response) => {
  if (!chaosState.memoryLeakEnabled) {
    return res.status(400).json({ error: 'Memory leak scenario not enabled' });
  }

  // INTENTIONAL BUG: Create large objects that won't be garbage collected
  for (let i = 0; i < 10000; i++) {
    memoryLeakStore.push({
      data: new Array(1000).fill('x'.repeat(1000)),
      timestamp: new Date(),
      metadata: {
        id: i,
        info: 'This object will never be freed',
      },
    });
  }

  const memoryUsage = process.memoryUsage();
  logger.warn('🔥 CHAOS: Memory leak triggered', {
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    leakSize: memoryLeakStore.length,
  });

  res.json({
    message: 'Memory leak triggered',
    currentHeapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    leakedObjects: memoryLeakStore.length,
  });
});

/**
 * SCENARIO 4: Redis Connection Pool Exhaustion
 * Creates many Redis connections without proper pooling
 */
router.post('/exhaust-pool', async (req: Request, res: Response) => {
  logger.warn('🔥 CHAOS: Exhausting connection pool');
  trackEvent('ChaosEnabled', { scenario: 'pool-exhaustion' });

  // INTENTIONAL BUG: Create many Redis clients without reusing connections
  const clients = [];
  try {
    for (let i = 0; i < 50; i++) {
      const client = createClient({
        url: process.env.REDIS_CONNECTION_STRING || 'redis://localhost:6379',
      });
      await client.connect();
      clients.push(client);
    }

    res.json({
      message: 'Connection pool exhausted',
      connectionsCreated: clients.length,
      warning: 'Application may now fail to get Redis connections',
    });
  } catch (error: any) {
    logger.error('Connection pool exhaustion failed:', error);
    res.status(500).json({ error: error.message });
  }
  // INTENTIONAL BUG: Not closing connections - they stay open
});

/**
 * SCENARIO 5: Unhandled Promise Rejection
 * Triggers async operations without proper error handling
 */
router.post('/unhandled-promise', (req: Request, res: Response) => {
  logger.warn('🔥 CHAOS: Triggering unhandled promise rejection');
  trackEvent('ChaosEnabled', { scenario: 'unhandled-promise' });

  // INTENTIONAL BUG: Async operation without error handling
  const riskyOperation = async () => {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('This promise rejection is intentionally unhandled!'));
      }, 100);
    });
  };

  // Call without await or catch - will cause unhandled rejection
  riskyOperation();

  res.json({
    message: 'Unhandled promise rejection triggered',
    warning: 'Check console for unhandled rejection warning',
  });
});

/**
 * SCENARIO 6: CPU Intensive Loop
 * Blocks the event loop with synchronous computation
 */
router.post('/cpu-spike', (req: Request, res: Response) => {
  logger.warn('🔥 CHAOS: Starting CPU intensive operation');
  trackEvent('ChaosEnabled', { scenario: 'cpu-spike' });

  const duration = parseInt(req.query.duration as string) || 30000; // 30 seconds default

  // INTENTIONAL BUG: Synchronous CPU-intensive operation that blocks event loop
  const startTime = Date.now();
  let counter = 0;

  while (Date.now() - startTime < duration) {
    // Expensive computation
    for (let i = 0; i < 1000000; i++) {
      counter += Math.sqrt(i) * Math.random();
    }
  }

  res.json({
    message: 'CPU spike completed',
    duration: `${duration}ms`,
    iterations: counter,
    warning: 'Event loop was blocked during this operation',
  });
});

/**
 * SCENARIO 7: Database Connection Timeout
 * Holds database connections open for extended periods
 */
router.post('/db-timeout', async (req: Request, res: Response) => {
  logger.warn('🔥 CHAOS: Starting long-running database transaction');
  trackEvent('ChaosEnabled', { scenario: 'db-timeout' });

  const duration = parseInt(req.query.duration as string) || 60000; // 60 seconds default

  try {
    // INTENTIONAL BUG: Long-running transaction that holds connection
    await prisma.$transaction(
      async (tx) => {
        // Start transaction
        await tx.$queryRaw`SELECT 1`;

        // Hold connection for extended period
        await new Promise((resolve) => setTimeout(resolve, duration));

        // Finally release
        await tx.$queryRaw`SELECT 2`;
      },
      {
        timeout: duration + 10000, // Allow transaction to complete
      }
    );

    res.json({
      message: 'Long transaction completed',
      duration: `${duration}ms`,
      warning: 'Connection was held for extended period',
    });
  } catch (error: any) {
    logger.error('Long transaction failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Seed test data for demonstrations
 */
router.post('/seed-data', async (req: Request, res: Response) => {
  const count = parseInt(req.body.count) || 100;

  logger.info(`Seeding ${count} test todos`);

  const todos = [];
  for (let i = 0; i < count; i++) {
    todos.push({
      title: `Test Todo ${i + 1}`,
      description: `This is a test todo item for demonstration purposes. Item number ${i + 1}.`,
      completed: Math.random() > 0.5,
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
    });
  }

  await prisma.todo.createMany({ data: todos });

  res.json({
    message: `Created ${count} test todos`,
    count,
  });
});

/**
 * Get chaos status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    scenarios: {
      memoryLeak: chaosState.memoryLeakEnabled,
      cpuSpike: chaosState.cpuSpikeEnabled,
      dbTimeout: chaosState.dbTimeoutEnabled,
      poolExhaustion: chaosState.poolExhaustionEnabled,
      unhandledPromise: chaosState.unhandledPromiseEnabled,
    },
    memoryLeakSize: memoryLeakStore.length,
  });
});

/**
 * Enable all chaos scenarios
 */
router.post('/enable-all', (req: Request, res: Response) => {
  chaosState = {
    memoryLeakEnabled: true,
    cpuSpikeEnabled: true,
    dbTimeoutEnabled: true,
    poolExhaustionEnabled: true,
    unhandledPromiseEnabled: true,
  };

  logger.warn('🔥 CHAOS: All scenarios enabled');
  trackEvent('ChaosEnabled', { scenario: 'all' });

  res.json({ message: 'All chaos scenarios enabled', state: chaosState });
});

/**
 * Disable all chaos scenarios
 */
router.post('/disable-all', (req: Request, res: Response) => {
  chaosState = {
    memoryLeakEnabled: false,
    cpuSpikeEnabled: false,
    dbTimeoutEnabled: false,
    poolExhaustionEnabled: false,
    unhandledPromiseEnabled: false,
  };

  memoryLeakStore.length = 0;

  logger.info('✅ CHAOS: All scenarios disabled');

  res.json({ message: 'All chaos scenarios disabled', state: chaosState });
});

/**
 * Reset environment (clear test data)
 */
router.post('/reset', async (req: Request, res: Response) => {
  logger.info('Resetting demo environment');

  // Disable all chaos
  chaosState = {
    memoryLeakEnabled: false,
    cpuSpikeEnabled: false,
    dbTimeoutEnabled: false,
    poolExhaustionEnabled: false,
    unhandledPromiseEnabled: false,
  };
  memoryLeakStore.length = 0;

  // Clear test data (keep seed data)
  await prisma.todo.deleteMany({
    where: {
      title: {
        startsWith: 'Test Todo',
      },
    },
  });

  res.json({
    message: 'Demo environment reset',
    chaosDisabled: true,
    testDataCleared: true,
  });
});

export default router;
