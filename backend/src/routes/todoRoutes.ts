import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { logger } from '../utils/logger';
import { trackEvent, trackMetric } from '../config/appInsights';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
});

/**
 * GET /api/todos
 * List all todos with optional filters
 * 
 * SCENARIO 2: N+1 Query Problem
 * When inefficient=true, demonstrates N+1 query issue
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { completed, priority, inefficient } = req.query;

  // Build filter
  const where: any = {};
  if (completed !== undefined) {
    where.completed = completed === 'true';
  }
  if (priority) {
    where.priority = priority;
  }

  try {
    // Check cache first
    const cacheKey = `todos:list:${JSON.stringify(where)}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      logger.debug('Returning cached todos');
      trackMetric('cache_hit', 1);
      return res.json(cached);
    }

    // SCENARIO 2: N+1 Query Problem (INTENTIONAL BUG)
    if (inefficient === 'true') {
      logger.warn('🔥 CHAOS: Using inefficient N+1 query pattern');
      trackEvent('ChaosTriggered', { scenario: 'n-plus-one' });

      // BAD: Fetch todos without relations
      const todos = await prisma.todo.findMany({ where });

      // BAD: Make separate query for each todo's metadata (N+1 problem!)
      const todosWithMetadata = [];
      for (const todo of todos) {
        const metadata = await prisma.todoMetadata.findUnique({
          where: { todoId: todo.id },
        });
        
        const tags = await prisma.tag.findMany({
          where: {
            todos: {
              some: { id: todo.id },
            },
          },
        });

        todosWithMetadata.push({
          ...todo,
          metadata,
          tags,
        });
      }

      const duration = Date.now() - startTime;
      logger.warn(`N+1 query took ${duration}ms for ${todos.length} todos`);
      trackMetric('query_duration_ms', duration);

      return res.json({
        todos: todosWithMetadata,
        count: todosWithMetadata.length,
        performance: {
          duration: `${duration}ms`,
          queriesExecuted: todos.length + 1 + (todos.length * 2),
          warning: 'N+1 query pattern detected',
        },
      });
    }

    // GOOD: Efficient query with proper joins
    const todos = await prisma.todo.findMany({
      where,
      include: {
        tags: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Cache the result
    await cache.set(cacheKey, { todos, count: todos.length }, 300); // 5 min TTL

    const duration = Date.now() - startTime;
    trackMetric('query_duration_ms', duration);

    res.json({
      todos,
      count: todos.length,
      performance: {
        duration: `${duration}ms`,
        cached: false,
      },
    });
  } catch (error) {
    logger.error('Error fetching todos:', error);
    throw new AppError('Failed to fetch todos', 500);
  }
});

/**
 * GET /api/todos/search
 * Search todos by title or description
 * 
 * SCENARIO 3: Missing Database Index
 * Demonstrates full table scan due to missing indexes
 */
router.get('/search', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    throw new AppError('Search query is required', 400);
  }

  try {
    logger.info(`Searching todos with query: ${q}`);
    trackEvent('TodoSearch', { query: q });

    // INTENTIONAL BUG: No index on title or description columns
    // This will cause full table scan on large datasets
    const todos = await prisma.todo.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        tags: true,
        metadata: true,
      },
    });

    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      logger.warn(`🔥 Slow search query: ${duration}ms`, {
        query: q,
        resultsCount: todos.length,
        warning: 'Consider adding database indexes',
      });
    }

    trackMetric('search_duration_ms', duration);

    res.json({
      todos,
      count: todos.length,
      query: q,
      performance: {
        duration: `${duration}ms`,
        warning: duration > 1000 ? 'Slow query detected - missing index?' : undefined,
      },
    });
  } catch (error) {
    logger.error('Error searching todos:', error);
    throw new AppError('Search failed', 500);
  }
});

/**
 * GET /api/todos/:id
 * Get a single todo by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nocache } = req.query;

  try {
    // Check cache
    if (!nocache) {
      const cached = await cache.get(`todo:${id}`);
      if (cached) {
        logger.debug(`Cache hit for todo ${id}`);
        trackMetric('cache_hit', 1);
        return res.json(cached);
      }
    }

    const todo = await prisma.todo.findUnique({
      where: { id },
      include: {
        tags: true,
        metadata: true,
      },
    });

    if (!todo) {
      throw new AppError('Todo not found', 404);
    }

    // Update view count
    if (todo.metadata) {
      await prisma.todoMetadata.update({
        where: { id: todo.metadata.id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      });
    }

    // Cache the result
    await cache.set(`todo:${id}`, todo, 3600); // 1 hour TTL

    res.json(todo);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`Error fetching todo ${id}:`, error);
    throw new AppError('Failed to fetch todo', 500);
  }
});

/**
 * POST /api/todos
 * Create a new todo
 * 
 * SCENARIO 9: Missing Error Handling
 * When validation fails, may expose sensitive information
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createTodoSchema.parse(req.body);

    const todo = await prisma.todo.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        completed: validatedData.completed,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        metadata: {
          create: {
            viewCount: 0,
          },
        },
      },
      include: {
        tags: true,
        metadata: true,
      },
    });

    // Invalidate list cache
    await cache.delPattern('todos:list:*');

    trackEvent('TodoCreated', { todoId: todo.id });
    logger.info(`Todo created: ${todo.id}`);

    res.status(201).json(todo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    
    // INTENTIONAL BUG: May expose sensitive info in error (Scenario 9)
    logger.error('Error creating todo:', error);
    throw error; // This will be caught by global error handler
  }
});

/**
 * PUT /api/todos/:id
 * Update a todo
 * 
 * SCENARIO 8: Cache Invalidation Bug
 * When skipCache=true, updates database but doesn't invalidate cache
 */
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { skipCache } = req.query;

  try {
    // Validate input
    const validatedData = updateTodoSchema.parse(req.body);

    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      throw new AppError('Todo not found', 404);
    }

    // Update todo
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        tags: true,
        metadata: true,
      },
    });

    // SCENARIO 8: Cache Invalidation Bug (INTENTIONAL BUG)
    if (skipCache !== 'true') {
      // GOOD: Properly invalidate cache
      await cache.del(`todo:${id}`);
      await cache.delPattern('todos:list:*');
      logger.debug(`Cache invalidated for todo ${id}`);
    } else {
      // BAD: Update database but don't invalidate cache
      logger.warn(`🔥 CHAOS: Cache not invalidated for todo ${id} - stale data will be served`);
      trackEvent('ChaosTriggered', { scenario: 'cache-invalidation-bug' });
    }

    trackEvent('TodoUpdated', { todoId: id });
    logger.info(`Todo updated: ${id}`);

    res.json(todo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    if (error instanceof AppError) throw error;
    
    logger.error(`Error updating todo ${id}:`, error);
    throw new AppError('Failed to update todo', 500);
  }
});

/**
 * DELETE /api/todos/:id
 * Delete a todo
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.todo.delete({
      where: { id },
    });

    // Invalidate cache
    await cache.del(`todo:${id}`);
    await cache.delPattern('todos:list:*');

    trackEvent('TodoDeleted', { todoId: id });
    logger.info(`Todo deleted: ${id}`);

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new AppError('Todo not found', 404);
    }
    
    logger.error(`Error deleting todo ${id}:`, error);
    throw new AppError('Failed to delete todo', 500);
  }
});

/**
 * POST /api/todos/:id/toggle
 * Toggle todo completion status
 */
router.post('/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      throw new AppError('Todo not found', 404);
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        completed: !existingTodo.completed,
      },
      include: {
        tags: true,
        metadata: true,
      },
    });

    // Invalidate cache
    await cache.del(`todo:${id}`);
    await cache.delPattern('todos:list:*');

    trackEvent('TodoToggled', { todoId: id, completed: String(todo.completed) });

    res.json(todo);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`Error toggling todo ${id}:`, error);
    throw new AppError('Failed to toggle todo', 500);
  }
});

export default router;
