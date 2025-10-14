# 🚀 Azure SRE Agent Demo - Full Stack Todo Platform

A comprehensive demonstration platform showcasing Azure SRE Agent capabilities with intentional chaos scenarios, complete monitoring, and automated incident response.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Chaos Scenarios](#chaos-scenarios)
- [Monitoring & Alerts](#monitoring--alerts)
- [CI/CD Pipeline](#cicd-pipeline)
- [Contributing](#contributing)

## 🎯 Overview

This repository demonstrates:
- ✅ Full-stack Todo application (React + Node.js + TypeScript)
- ✅ Infrastructure as Code with Terraform
- ✅ Comprehensive Azure monitoring and alerting
- ✅ GitHub Actions CI/CD pipelines
- ✅ Intentional bugs and chaos scenarios for SRE Agent demonstration
- ✅ Automated issue creation and resolution workflows

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Static Web)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Express API    │◄────►│  PostgreSQL  │
│  (App Service)  │      │  (Flexible)  │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Redis Cache    │      │  App Insights│
│                 │      │  + Monitoring│
└─────────────────┘      └──────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Query (TanStack Query)** for data fetching
- **Axios** for HTTP client
- **Azure Static Web Apps** for hosting

### Backend
- **Node.js 20** with Express
- **TypeScript** for type safety
- **Prisma ORM** for database access
- **Redis** for caching
- **Winston** for logging
- **Azure App Service / Container Apps**

### Infrastructure
- **Azure Database for PostgreSQL Flexible Server**
- **Azure Cache for Redis**
- **Azure Application Insights**
- **Azure Key Vault**
- **Azure Monitor & Log Analytics**
- **Terraform** for IaC

### DevOps
- **GitHub Actions** for CI/CD
- **Docker** for containerization
- **Azure CLI** for deployment
- **Terraform Cloud** (optional)

## 📦 Prerequisites

- **Node.js 20+** and npm/yarn
- **Docker** and Docker Compose
- **Terraform 1.5+**
- **Azure CLI** 2.50+
- **Azure Subscription** with contributor access
- **GitHub Account** with Actions enabled

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/sre-demo.git
cd sre-demo
```

### 2. Local Development Setup

```bash
# Install dependencies for both frontend and backend
cd frontend && npm install
cd ../backend && npm install

# Start local infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations
cd backend
npm run prisma:migrate

# Start backend (terminal 1)
npm run dev

# Start frontend (terminal 2)
cd ../frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000

### 3. Infrastructure Deployment

```bash
# Login to Azure
az login

# Initialize Terraform
cd terraform/environments/dev
terraform init

# Plan infrastructure
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### 4. Configure GitHub Secrets

Required secrets for GitHub Actions:
- `AZURE_CREDENTIALS`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `DATABASE_URL`
- `REDIS_CONNECTION_STRING`

## 🔥 Chaos Scenarios

This repository includes intentional bugs and performance issues for demonstration purposes. See [docs/CHAOS_SCENARIOS.md](docs/CHAOS_SCENARIOS.md) for detailed trigger instructions.

### Available Scenarios

| Scenario | Type | Severity | Trigger |
|----------|------|----------|---------|
| Memory Leak | Performance | High | `POST /api/chaos/memory-leak` |
| N+1 Query Problem | Performance | Medium | `GET /api/todos?inefficient=true` |
| Missing Index | Performance | Medium | `GET /api/todos/search?q=term` |
| Connection Pool Exhaustion | Availability | Critical | `POST /api/chaos/exhaust-pool` |
| Unhandled Promise Rejection | Reliability | High | `POST /api/chaos/unhandled-promise` |
| CPU Intensive Loop | Performance | Critical | `POST /api/chaos/cpu-spike` |
| Database Timeout | Availability | High | `POST /api/chaos/db-timeout` |
| Cache Invalidation Bug | Data Integrity | Medium | `PUT /api/todos/:id?skipCache=true` |
| Missing Error Handling | Reliability | Medium | `POST /api/todos` (malformed data) |
| Infrastructure Drift | Configuration | Low | Manual Terraform changes |

## 📊 Monitoring & Alerts

### Configured Alerts

- ⚠️ **High CPU Usage** (>80% for 5 minutes)
- ⚠️ **High Memory Usage** (>85% for 5 minutes)
- ⚠️ **Error Rate Spike** (>5% of requests)
- ⚠️ **Response Time Degradation** (>2s average)
- ⚠️ **Database Connection Issues**
- ⚠️ **Failed Deployments**
- ⚠️ **Infrastructure Drift Detected**

### Dashboards

- Application Performance (Application Insights)
- Infrastructure Health (Azure Monitor)
- Database Performance (PostgreSQL Insights)
- Cache Metrics (Redis Insights)

## 🔄 CI/CD Pipeline

### Workflows

1. **Frontend Deployment** (`.github/workflows/frontend-deploy.yml`)
   - Build React application
   - Run tests and linting
   - Deploy to Azure Static Web Apps

2. **Backend Deployment** (`.github/workflows/backend-deploy.yml`)
   - Build Docker image
   - Run tests and linting
   - Push to Azure Container Registry
   - Deploy to Azure App Service

3. **Infrastructure Deployment** (`.github/workflows/infrastructure-deploy.yml`)
   - Terraform plan
   - Manual approval for production
   - Terraform apply
   - Drift detection

## 📚 Documentation

- [Architecture Details](docs/ARCHITECTURE.md)
- [Chaos Scenarios Guide](docs/CHAOS_SCENARIOS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Monitoring Setup](docs/MONITORING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🤝 Contributing

This is a demo repository. For suggestions or improvements:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Resources

- [Azure SRE Agent Documentation](https://learn.microsoft.com/azure)
- [GitHub Copilot](https://github.com/features/copilot)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Architecture Center](https://learn.microsoft.com/azure/architecture/)

---

**Built with ❤️ for Azure SRE Agent demonstrations**
