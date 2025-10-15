import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/projects
 * List all projects with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            todos: true,
            members: true,
          },
        },
        members: {
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const count = await prisma.project.count({ where });

    res.json({
      projects,
      count,
    });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get project details with todos and members
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        todos: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            tags: true,
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            todos: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * GET /api/projects/:id/stats
 * Get project statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [totalTodos, completedTodos, todosByPriority] = await Promise.all([
      prisma.todo.count({ where: { projectId: id } }),
      prisma.todo.count({ where: { projectId: id, completed: true } }),
      prisma.todo.groupBy({
        by: ['priority'],
        where: { projectId: id, completed: false },
        _count: true,
      }),
    ]);

    const priorityBreakdown = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    todosByPriority.forEach((item) => {
      priorityBreakdown[item.priority as keyof typeof priorityBreakdown] = item._count;
    });

    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    res.json({
      totalTodos,
      completedTodos,
      activeTodos: totalTodos - completedTodos,
      completionRate: Math.round(completionRate * 10) / 10,
      priorityBreakdown,
    });
  } catch (error) {
    logger.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
});

export default router;
