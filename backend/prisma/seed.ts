import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.todoMetadata.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.tag.deleteMany();

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: 'work', color: '#3B82F6' },
    }),
    prisma.tag.create({
      data: { name: 'personal', color: '#10B981' },
    }),
    prisma.tag.create({
      data: { name: 'urgent', color: '#EF4444' },
    }),
    prisma.tag.create({
      data: { name: 'shopping', color: '#F59E0B' },
    }),
  ]);

  // Create sample todos
  const todos = await Promise.all([
    prisma.todo.create({
      data: {
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the SRE demo project',
        priority: 'HIGH',
        completed: false,
        tags: {
          connect: [{ id: tags[0].id }], // work
        },
        metadata: {
          create: {
            estimatedTime: 120,
            notes: 'Include architecture diagrams',
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Review pull requests',
        description: 'Review and approve pending PRs',
        priority: 'MEDIUM',
        completed: false,
        tags: {
          connect: [{ id: tags[0].id }], // work
        },
        metadata: {
          create: {
            estimatedTime: 60,
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Buy groceries',
        description: 'Milk, bread, eggs, vegetables',
        priority: 'LOW',
        completed: false,
        tags: {
          connect: [{ id: tags[1].id }, { id: tags[3].id }], // personal, shopping
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Fix production bug',
        description: 'Critical bug affecting user authentication',
        priority: 'URGENT',
        completed: true,
        tags: {
          connect: [{ id: tags[0].id }, { id: tags[2].id }], // work, urgent
        },
        metadata: {
          create: {
            estimatedTime: 180,
            actualTime: 240,
            viewCount: 15,
            notes: 'Fixed in commit abc123',
          },
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Schedule team meeting',
        description: 'Weekly sync with the development team',
        priority: 'MEDIUM',
        completed: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        tags: {
          connect: [{ id: tags[0].id }], // work
        },
      },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);
  console.log(`✅ Created ${todos.length} todos`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
