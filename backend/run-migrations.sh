#!/bin/bash
export DATABASE_URL='postgresql://adminuser:SREDemo2025!Secure@sre-demo-postgres-dev-vtwadj.postgres.database.azure.com:5432/todoapp?sslmode=require'
cd /Users/paulasilva/Documents/GH-REPOS/sre-demo/backend
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy
echo ""
echo "🌱 Seeding database..."
npm run prisma:seed
