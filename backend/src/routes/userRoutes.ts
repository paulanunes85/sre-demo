import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/users
 * List all users with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            todos: true,
            comments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const count = await prisma.user.count({ where });

    res.json({
      users,
      count,
      page: 1,
      pageSize: users.length,
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id
 * Get user details with todos and projects
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        todos: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            tags: true,
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        projects: {
          include: {
            project: {
              include: {
                _count: {
                  select: {
                    todos: true,
                    members: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            todos: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [totalTodos, completedTodos, urgentTodos, todosThisWeek] = await Promise.all([
      prisma.todo.count({ where: { assigneeId: id } }),
      prisma.todo.count({ where: { assigneeId: id, completed: true } }),
      prisma.todo.count({ where: { assigneeId: id, priority: 'URGENT', completed: false } }),
      prisma.todo.count({
        where: {
          assigneeId: id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    res.json({
      totalTodos,
      completedTodos,
      activeTodos: totalTodos - completedTodos,
      urgentTodos,
      todosThisWeek,
      completionRate: Math.round(completionRate * 10) / 10,
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

export default router;
