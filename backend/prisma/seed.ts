import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in correct order
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.todoMetadata.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice.johnson@company.com',
        name: 'Alice Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.smith@company.com',
        name: 'Bob Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        role: 'MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carol.white@company.com',
        name: 'Carol White',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
        role: 'MEMBER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.brown@company.com',
        name: 'David Brown',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        role: 'MEMBER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma.davis@company.com',
        name: 'Emma Davis',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        role: 'MEMBER',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'SRE Platform Migration',
        description: 'Migrate legacy monitoring to Azure native solutions',
        color: '#3b82f6',
        icon: '🚀',
        status: 'ACTIVE',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'API Gateway Improvement',
        description: 'Enhance API Gateway performance and security',
        color: '#10b981',
        icon: '🔐',
        status: 'ACTIVE',
        startDate: new Date('2025-02-01'),
      },
    }),
    prisma.project.create({
      data: {
        name: 'Infrastructure Automation',
        description: 'Automate infrastructure provisioning with Terraform',
        color: '#f59e0b',
        icon: '⚙️',
        status: 'PLANNING',
      },
    }),
    prisma.project.create({
      data: {
        name: 'Q4 2024 Platform Updates',
        description: 'Quarterly platform improvements and bug fixes',
        color: '#8b5cf6',
        icon: '📊',
        status: 'COMPLETED',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-31'),
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // Create project members
  await Promise.all([
    // SRE Platform Migration
    prisma.projectMember.create({
      data: { projectId: projects[0].id, userId: users[0].id, role: 'OWNER' },
    }),
    prisma.projectMember.create({
      data: { projectId: projects[0].id, userId: users[1].id, role: 'ADMIN' },
    }),
    prisma.projectMember.create({
      data: { projectId: projects[0].id, userId: users[2].id, role: 'MEMBER' },
    }),
    // API Gateway
    prisma.projectMember.create({
      data: { projectId: projects[1].id, userId: users[1].id, role: 'OWNER' },
    }),
    prisma.projectMember.create({
      data: { projectId: projects[1].id, userId: users[3].id, role: 'MEMBER' },
    }),
    // Infrastructure Automation
    prisma.projectMember.create({
      data: { projectId: projects[2].id, userId: users[0].id, role: 'OWNER' },
    }),
    prisma.projectMember.create({
      data: { projectId: projects[2].id, userId: users[4].id, role: 'MEMBER' },
    }),
  ]);

  console.log('✅ Created project memberships');

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'urgent', color: '#ef4444' } }),
    prisma.tag.create({ data: { name: 'bug', color: '#dc2626' } }),
    prisma.tag.create({ data: { name: 'feature', color: '#3b82f6' } }),
    prisma.tag.create({ data: { name: 'documentation', color: '#8b5cf6' } }),
    prisma.tag.create({ data: { name: 'performance', color: '#f59e0b' } }),
    prisma.tag.create({ data: { name: 'security', color: '#ef4444' } }),
    prisma.tag.create({ data: { name: 'devops', color: '#10b981' } }),
    prisma.tag.create({ data: { name: 'frontend', color: '#06b6d4' } }),
    prisma.tag.create({ data: { name: 'backend', color: '#8b5cf6' } }),
    prisma.tag.create({ data: { name: 'testing', color: '#84cc16' } }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create todos with rich data
  const todos = await Promise.all([
    prisma.todo.create({
      data: {
        title: 'Configure Azure Application Insights',
        description: 'Set up Application Insights with custom metrics and alerts for production monitoring',
        priority: 'HIGH',
        completed: false,
        assigneeId: users[0].id,
        projectId: projects[0].id,
        dueDate: new Date(Date.now() + 172800000), // 2 days
        tags: { connect: [{ id: tags[0].id }, { id: tags[6].id }] },
        metadata: {
          create: {
            estimatedTime: 120,
            notes: 'Include custom dimensions for request tracking',
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Fix memory leak in API Gateway',
        description: 'Investigate and resolve memory leak causing high memory usage after 24h runtime',
        priority: 'URGENT',
        completed: false,
        assigneeId: users[1].id,
        projectId: projects[1].id,
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        tags: { connect: [{ id: tags[0].id }, { id: tags[1].id }, { id: tags[8].id }] },
        metadata: {
          create: {
            estimatedTime: 240,
            notes: 'Check for unclosed connections and event listeners',
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Implement rate limiting',
        description: 'Add Redis-based rate limiting to prevent API abuse',
        priority: 'HIGH',
        completed: false,
        assigneeId: users[3].id,
        projectId: projects[1].id,
        dueDate: new Date(Date.now() + 604800000), // 7 days
        tags: { connect: [{ id: tags[2].id }, { id: tags[5].id }, { id: tags[8].id }] },
        metadata: {
          create: {
            estimatedTime: 180,
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Update Terraform modules',
        description: 'Update all Terraform modules to latest versions and fix deprecated syntax',
        priority: 'MEDIUM',
        completed: true,
        assigneeId: users[4].id,
        projectId: projects[2].id,
        tags: { connect: [{ id: tags[6].id }] },
        metadata: {
          create: {
            estimatedTime: 90,
            actualTime: 105,
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Redesign dashboard UI',
        description: 'Create modern, responsive dashboard with real-time metrics visualization',
        priority: 'MEDIUM',
        completed: false,
        assigneeId: users[2].id,
        projectId: projects[0].id,
        dueDate: new Date(Date.now() + 1209600000), // 14 days
        tags: { connect: [{ id: tags[2].id }, { id: tags[7].id }] },
        metadata: {
          create: {
            estimatedTime: 360,
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Write API documentation',
        description: 'Document all REST API endpoints with OpenAPI/Swagger',
        priority: 'MEDIUM',
        completed: false,
        assigneeId: users[2].id,
        projectId: projects[1].id,
        tags: { connect: [{ id: tags[3].id }] },
        metadata: {
          create: {
            estimatedTime: 240,
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Optimize database queries',
        description: 'Add indexes and optimize slow queries identified in production',
        priority: 'HIGH',
        completed: false,
        assigneeId: users[1].id,
        projectId: projects[0].id,
        dueDate: new Date(Date.now() + 259200000), // 3 days
        tags: { connect: [{ id: tags[4].id }, { id: tags[8].id }] },
        metadata: {
          create: {
            estimatedTime: 150,
            notes: 'Focus on todo listing and search endpoints',
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Set up automated backups',
        description: 'Configure automated daily backups for PostgreSQL database',
        priority: 'HIGH',
        completed: true,
        assigneeId: users[0].id,
        projectId: projects[0].id,
        tags: { connect: [{ id: tags[6].id }] },
        metadata: {
          create: {
            estimatedTime: 60,
            actualTime: 75,
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Implement end-to-end tests',
        description: 'Add Playwright tests for critical user journeys',
        priority: 'MEDIUM',
        completed: false,
        assigneeId: users[3].id,
        projectId: projects[0].id,
        tags: { connect: [{ id: tags[9].id }, { id: tags[7].id }] },
        metadata: {
          create: {
            estimatedTime: 300,
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Security audit review',
        description: 'Review and address findings from latest security audit',
        priority: 'URGENT',
        completed: false,
        assigneeId: users[0].id,
        projectId: projects[1].id,
        dueDate: new Date(Date.now() + 172800000), // 2 days
        tags: { connect: [{ id: tags[0].id }, { id: tags[5].id }] },
        metadata: {
          create: {
            estimatedTime: 480,
            notes: 'Address SQL injection and XSS vulnerabilities',
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Migrate to microservices',
        description: 'Plan and execute migration from monolith to microservices architecture',
        priority: 'LOW',
        completed: false,
        assigneeId: users[1].id,
        projectId: projects[2].id,
        tags: { connect: [{ id: tags[6].id }, { id: tags[8].id }] },
        metadata: {
          create: {
            estimatedTime: 2400, // 40 hours
            notes: 'Long-term initiative, break into smaller tasks',
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Update dependencies',
        description: 'Update all npm packages to latest stable versions',
        priority: 'LOW',
        completed: true,
        assigneeId: users[4].id,
        projectId: projects[0].id,
        tags: { connect: [{ id: tags[6].id }] },
        metadata: {
          create: {
            estimatedTime: 45,
            actualTime: 60,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${todos.length} todos`);

  // Create comments
  await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Started working on this. Will have it done by EOD.',
        todoId: todos[0].id,
        authorId: users[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Found the root cause - connection pool not being released properly.',
        todoId: todos[1].id,
        authorId: users[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Should we use express-rate-limit or implement custom Redis solution?',
        todoId: todos[2].id,
        authorId: users[3].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Custom Redis solution would be more flexible for our needs.',
        todoId: todos[2].id,
        authorId: users[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'All modules updated and tested. Ready for review.',
        todoId: todos[3].id,
        authorId: users[4].id,
      },
    }),
  ]);

  console.log('✅ Created comments');

  // Create attachments
  await Promise.all([
    prisma.attachment.create({
      data: {
        filename: 'memory-leak-analysis.pdf',
        fileUrl: 'https://storage.example.com/attachments/memory-leak-analysis.pdf',
        fileSize: 2048576, // 2MB
        mimeType: 'application/pdf',
        todoId: todos[1].id,
      },
    }),
    prisma.attachment.create({
      data: {
        filename: 'dashboard-mockup.fig',
        fileUrl: 'https://storage.example.com/attachments/dashboard-mockup.fig',
        fileSize: 5242880, // 5MB
        mimeType: 'application/octet-stream',
        todoId: todos[4].id,
      },
    }),
    prisma.attachment.create({
      data: {
        filename: 'security-audit-report.pdf',
        fileUrl: 'https://storage.example.com/attachments/security-audit-report.pdf',
        fileSize: 3145728, // 3MB
        mimeType: 'application/pdf',
        todoId: todos[9].id,
      },
    }),
  ]);

  console.log('✅ Created attachments');

  console.log('🎉 Seeding completed successfully!');
  console.log(`
  📊 Summary:
  - ${users.length} users
  - ${projects.length} projects
  - ${tags.length} tags
  - ${todos.length} todos
  - 5 comments
  - 3 attachments
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
