# 🚀 SRE Demo - Modern Task Management Platform

## 📋 Overview

A modern, full-stack task management platform built with **React**, **TypeScript**, **Node.js**, **PostgreSQL**, and **Azure**. This demo showcases **Site Reliability Engineering** practices, monitoring, and chaos engineering scenarios.

## 🎯 What's New

### Enhanced Backend
- ✅ **Users Management** - Complete user profiles with roles (Admin, Manager, Member)
- ✅ **Projects** - Organize todos into projects with status tracking
- ✅ **Comments** - Collaborative commenting on todos
- ✅ **Attachments** - File attachments support
- ✅ **Rich Statistics** - User and project analytics endpoints

### Modern Frontend (To Deploy)
- ✅ **Dashboard** - Overview with real-time statistics
- ✅ **Multi-page Navigation** - React Router integration
- ✅ **Projects View** - Visual project management
- ✅ **Team Management** - User profiles and statistics
- ✅ **Modern UI** - Tailwind CSS with glassmorphism effects
- ✅ **Responsive Design** - Mobile-first approach

### Rich Mock Data
- 📊 5 Users with realistic profiles and avatars
- 📁 4 Projects (Active, Planning, Completed)
- ✅ 12 Todos with priorities, assignments, and due dates
- 💬 5 Comments across todos
- 📎 3 File attachments
- 🏷️ 10 Tags (bug, feature, security, etc.)

## 🛠️ Next Steps

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install react-router-dom recharts clsx
```

### 2. Complete Frontend Setup

The frontend structure is ready with:
- `src/components/Layout.tsx` - Main layout with navigation
- `src/App-new.tsx` - Router configuration (rename to App.tsx when ready)

**Required Pages to Create:**
- `src/pages/Dashboard.tsx` - Main dashboard with stats
- `src/pages/TodosPage.tsx` - Enhanced todos list
- `src/pages/ProjectsPage.tsx` - Projects overview
- `src/pages/ProjectDetails.tsx` - Individual project view
- `src/pages/UsersPage.tsx` - Team members list
- `src/pages/UserDetails.tsx` - User profile page

### 3. Backend Deployment Status

The backend has been deployed with:
- **New Database Schema** - Users, Projects, Comments, Attachments
- **New Endpoints**:
  - `GET /api/users` - List users
  - `GET /api/users/:id` - User details
  - `GET /api/users/:id/stats` - User statistics
  - `GET /api/projects` - List projects
  - `GET /api/projects/:id` - Project details
  - `GET /api/projects/:id/stats` - Project statistics

### 4. Database Migration & Seeding

After backend deployment completes, run migrations and seed:

```bash
# Via Azure Web SSH or Cloud Shell
cd /home/site/wwwroot
npx prisma migrate deploy
npm run seed
```

### 5. Testing New Endpoints

```bash
# Test users endpoint
curl https://sre-demo-backend-dev-vtwadj.azurewebsites.net/api/users | jq

# Test projects endpoint
curl https://sre-demo-backend-dev-vtwadj.azurewebsites.net/api/projects | jq

# Test todos (should now include assignee and project data)
curl https://sre-demo-backend-dev-vtwadj.azurewebsites.net/api/todos | jq
```

## 📊 Enhanced Data Model

```
User (5 users)
  ├─ role: ADMIN | MANAGER | MEMBER
  ├─ avatar: Generated avatar URL
  └─ Relations: todos, comments, projects

Project (4 projects)
  ├─ status: PLANNING | ACTIVE | ON_HOLD | COMPLETED
  ├─ color & icon for visual identity
  ├─ start/end dates
  └─ Relations: todos, members

Todo (12 todos)
  ├─ priority: LOW | MEDIUM | HIGH | URGENT
  ├─ assignee (User)
  ├─ project (Project)
  ├─ tags (multiple)
  ├─ comments
  ├─ attachments
  └─ metadata (view count, time estimates)

Comment (5 comments)
  ├─ content
  ├─ author (User)
  └─ todo

Attachment (3 attachments)
  ├─ filename
  ├─ fileUrl
  ├─ fileSize & mimeType
  └─ todo
```

## 🎨 Frontend Pages Overview

### Dashboard
- Total todos, completion rate
- Active projects count
- Team members overview
- Recent activity feed
- Priority breakdown chart

### Todos Page
- Filterable list (all/active/completed)
- Group by project or assignee
- Priority color coding
- Quick actions (complete, delete)
- Create new todo modal

### Projects Page
- Grid view of all projects
- Status badges (Planning, Active, etc.)
- Progress indicators
- Member avatars
- Quick stats per project

### Project Details
- Project header with icon and color
- All todos in the project
- Team members section
- Progress charts
- Activity timeline

### Users Page
- Team members grid
- Role badges (Admin, Manager, Member)
- Todo counts per user
- Completion rates
- Search and filter

### User Details
- User profile with avatar
- Statistics dashboard
- Assigned todos list
- Project memberships
- Recent comments

## 🔧 Technical Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis
- **Monitoring**: Application Insights
- **Container**: Docker (Alpine + OpenSSL fix)

### Frontend
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Build**: Vite

### Infrastructure
- **Hosting**: Azure App Service (Backend) + Static Web App (Frontend)
- **Database**: Azure Database for PostgreSQL
- **Cache**: Azure Cache for Redis
- **Monitoring**: Application Insights + Log Analytics
- **IaC**: Terraform

## 🚀 Quick Start Commands

```bash
# Backend (already deployed)
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev

# Frontend (after installing dependencies)
cd frontend
npm install
npm run dev
```

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
REDIS_CONNECTION_STRING=rediss://...
APPLICATIONINSIGHTS_CONNECTION_STRING=...
NODE_ENV=production
PORT=8080
```

### Frontend (.env)
```env
VITE_API_URL=https://sre-demo-backend-dev-vtwadj.azurewebsites.net/api
```

## 🎯 Immediate Action Items

1. ✅ **Backend Deployed** - New schema and endpoints are deploying
2. ⏳ **Wait for Deployment** - Check workflow status
3. 🗄️ **Run Database Migration** - Apply new schema
4. 🌱 **Seed Database** - Load mock data
5. 🧪 **Test Endpoints** - Verify new API routes
6. 🎨 **Complete Frontend** - Create remaining pages
7. 🚀 **Deploy Frontend** - Azure Static Web App

## 📚 API Documentation

### Users Endpoints
```http
GET    /api/users              # List all users
GET    /api/users/:id          # Get user details
GET    /api/users/:id/stats    # User statistics
```

### Projects Endpoints
```http
GET    /api/projects           # List all projects
GET    /api/projects/:id       # Get project details
GET    /api/projects/:id/stats # Project statistics
```

### Enhanced Todos
Todos now include:
- `assignee` - Assigned user object
- `project` - Project object
- `comments` - Array of comments
- `attachments` - Array of files

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)
- **Purple**: Purple (#8b5cf6)

### Priority Colors
- **LOW**: Blue
- **MEDIUM**: Yellow
- **HIGH**: Orange
- **URGENT**: Red

### Project Status Colors
- **PLANNING**: Gray
- **ACTIVE**: Green
- **ON_HOLD**: Yellow
- **COMPLETED**: Blue
- **ARCHIVED**: Gray

## 📊 Success Metrics

Once deployed, you'll have:
- 🎯 **12 Realistic Todos** across 4 projects
- 👥 **5 Team Members** with different roles
- 📁 **4 Projects** in various states
- 💬 **5 Comments** for collaboration
- 📎 **3 Attachments** for context

## 🐛 Known Issues (Intentional for Demo)
- Missing database indexes (Scenario 3)
- Potential memory leaks (Chaos scenarios)
- No authentication (simplified demo)

---

**Built with ❤️ for Azure SRE demonstrations**
