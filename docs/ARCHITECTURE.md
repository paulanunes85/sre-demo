# System Architecture

## Overview

This document describes the architecture of the Azure SRE Demo application, a full-stack Todo application designed to demonstrate Azure monitoring, alerting, and SRE Agent capabilities through intentional chaos engineering scenarios.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Frontend   │  │   Backend    │  │   Infrastructure     │  │
│  │    Deploy    │  │    Deploy    │  │   Deploy + Drift     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Azure Cloud Platform                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Azure Static Web Apps (Frontend)            │  │
│  │                React + Vite + TypeScript                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼ HTTPS                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Azure App Service (Backend API)                │  │
│  │      Node.js + Express + TypeScript + Prisma             │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │          Chaos Engineering Endpoints                 │ │  │
│  │  │  /api/chaos/memory-leak                             │ │  │
│  │  │  /api/chaos/cpu-spike                               │ │  │
│  │  │  /api/chaos/connection-pool                         │ │  │
│  │  │  /api/chaos/unhandled-promise                       │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PostgreSQL   │  │  Azure Redis    │  │  Application    │ │
│  │ Flexible Server│  │     Cache       │  │    Insights     │ │
│  │                │  │                 │  │                 │ │
│  │  - Todo Data   │  │  - Session Cache│  │  - Telemetry    │ │
│  │  - Metadata    │  │  - Todo Cache   │  │  - Logs         │ │
│  │  - Tags        │  │  - Rate Limit   │  │  - Metrics      │ │
│  └────────────────┘  └─────────────────┘  │  - Traces       │ │
│                                            └─────────────────┘ │
│                                                     │           │
│                                                     ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Log Analytics Workspace                     │  │
│  │                                                            │  │
│  │  - Kusto Query Language (KQL) queries                    │  │
│  │  - Custom dashboards                                      │  │
│  │  - Alert rule evaluation                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Azure Monitor Alerts                      │  │
│  │                                                            │  │
│  │  - CPU > 80%                                              │  │
│  │  - Memory > 85%                                           │  │
│  │  - HTTP 5xx > 10/min                                      │  │
│  │  - Response Time > 2s                                     │  │
│  │  - Database Connection Failures                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Monitor Action Group                        │  │
│  │                                                            │  │
│  │  - Email notifications                                    │  │
│  │  - Creates GitHub Issues (via Azure SRE Agent)           │  │
│  │  - Triggers automated remediation                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Azure Key Vault                        │  │
│  │                                                            │  │
│  │  - Database connection strings                            │  │
│  │  - Redis connection strings                               │  │
│  │  - Application Insights keys                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Frontend (React + TypeScript + Vite)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for data fetching and caching
- Tailwind CSS for styling
- Axios for HTTP requests

**Responsibilities:**
- Render todo list UI
- Handle user interactions (create, update, delete, toggle)
- Filter todos by status and priority
- Trigger chaos scenarios for demonstration
- Display real-time updates

**Key Features:**
- Responsive design with dark theme
- Optimistic UI updates
- Toast notifications for user feedback
- Priority color coding (High=red, Medium=yellow, Low=green)

### Backend API (Node.js + Express + TypeScript)

**Technology Stack:**
- Node.js 20 LTS
- Express 4.18
- TypeScript 5.3
- Prisma ORM 5.7
- Winston for logging
- Application Insights SDK

**Responsibilities:**
- RESTful API for todo operations
- Chaos engineering endpoints
- Health check endpoints
- Request/response logging
- Error handling and monitoring
- Rate limiting

**API Endpoints:**

**Todo Management:**
- `GET /api/todos` - List all todos (with optional inefficient mode)
- `POST /api/todos` - Create new todo
- `GET /api/todos/:id` - Get single todo
- `PATCH /api/todos/:id` - Update todo (with optional cache skip)
- `DELETE /api/todos/:id` - Delete todo
- `PATCH /api/todos/:id/toggle` - Toggle completion status

**Chaos Engineering:**
- `POST /api/chaos/memory-leak` - Trigger memory leak
- `POST /api/chaos/cpu-spike` - Trigger CPU spike
- `POST /api/chaos/connection-pool` - Exhaust connection pool
- `POST /api/chaos/unhandled-promise` - Trigger unhandled promise
- `POST /api/chaos/db-timeout` - Cause database timeout

**Health Checks:**
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependencies
- `GET /api/health/memory` - Memory usage statistics
- `GET /api/health/cpu` - CPU usage information
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/live` - Kubernetes liveness probe

### Database (PostgreSQL Flexible Server)

**Configuration:**
- PostgreSQL 16
- SKU: B_Standard_B1ms (Burstable, 1 vCore, 2GB RAM)
- Storage: 32 GB
- Backup retention: 7 days

**Schema:**

```prisma
model Todo {
  id          String         @id @default(uuid())
  title       String
  description String?
  completed   Boolean        @default(false)
  priority    Priority       @default(MEDIUM)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  tags        Tag[]
  metadata    TodoMetadata?
}

model Tag {
  id     String @id @default(uuid())
  name   String @unique
  color  String
  todoId String
  todo   Todo   @relation(fields: [todoId], references: [id])
}

model TodoMetadata {
  id          String   @id @default(uuid())
  todoId      String   @unique
  category    String?
  estimatedTime Int?
  actualTime   Int?
  notes       String?
  todo        Todo     @relation(fields: [todoId], references: [id])
}
```

**Intentional Issues:**
- Missing indexes on `title` and `description` columns (Scenario 3)
- N+1 query patterns in API endpoints (Scenario 2)

### Cache (Azure Redis Cache)

**Configuration:**
- SKU: Basic C0 (250 MB)
- TLS 1.2 required
- Authentication enabled

**Cache Strategy:**
- Cache todo lists with 5-minute TTL
- Invalidate cache on create/update/delete operations
- Use Redis as session store
- Cache frequently accessed todos

**Cache Keys:**
- `todos:all` - All todos list
- `todos:completed` - Completed todos
- `todos:pending` - Pending todos
- `todo:{id}` - Individual todo

**Intentional Issues:**
- Cache invalidation bug in update endpoint (Scenario 8)
- Connection pool exhaustion scenario (Scenario 4)

### Monitoring (Application Insights + Log Analytics)

**Telemetry Collection:**
- HTTP requests and responses
- Custom events for business operations
- Exception tracking with stack traces
- Performance metrics (CPU, memory, response time)
- Dependency tracking (database, Redis, external APIs)

**Custom Metrics:**
- `todos_created` - Counter for new todos
- `todos_completed` - Counter for completed todos
- `cache_hit_rate` - Cache effectiveness
- `api_response_time` - Response time distribution

**Kusto Queries:**

```kql
// High error rate detection
requests
| where timestamp > ago(5m)
| summarize 
    total = count(),
    errors = countif(resultCode >= 500)
| extend error_rate = (errors * 100.0) / total
| where error_rate > 5

// Slow queries
dependencies
| where type == "SQL"
| where duration > 2000
| summarize count() by operation_Name, bin(timestamp, 5m)

// Memory usage trend
performanceCounters
| where name == "% Processor Time"
| summarize avg(value) by bin(timestamp, 1m)
```

### Alert Rules

**CPU Alert:**
- Metric: CpuPercentage
- Threshold: > 80%
- Window: 5 minutes
- Frequency: 1 minute
- Severity: 2 (Warning)

**Memory Alert:**
- Metric: MemoryPercentage
- Threshold: > 85%
- Window: 5 minutes
- Frequency: 1 minute
- Severity: 2 (Warning)

**HTTP Error Alert:**
- Metric: Http5xx
- Threshold: > 10 per minute
- Window: 5 minutes
- Frequency: 1 minute
- Severity: 1 (Error)

**Response Time Alert:**
- Metric: ResponseTime
- Threshold: > 2 seconds
- Window: 5 minutes
- Frequency: 1 minute
- Severity: 2 (Warning)

## Infrastructure as Code (Terraform)

**Resources Managed:**
- Resource Group
- PostgreSQL Flexible Server
- Azure Redis Cache
- App Service Plan
- Linux Web App (Backend)
- Static Web App (Frontend)
- Application Insights
- Log Analytics Workspace
- Key Vault
- Monitor Action Group
- Metric Alerts
- Diagnostic Settings

**State Management:**
- Remote state stored in Azure Storage (optional)
- State locking with blob lease
- Sensitive outputs marked appropriately

**Drift Detection:**
- Scheduled daily runs via GitHub Actions
- Detects manual changes in Azure Portal
- Creates GitHub issues for drift alerts
- Scenario 10 demonstration capability

## CI/CD Pipeline

### Frontend Pipeline
1. Checkout code
2. Install dependencies
3. Run linter (continue on error for demo)
4. Build with Vite
5. Deploy to Azure Static Web Apps

### Backend Pipeline
1. Checkout code
2. Install dependencies
3. Generate Prisma Client
4. Run linter (continue on error for demo)
5. Build TypeScript
6. Build Docker image
7. Push to Azure Container Registry
8. Deploy to App Service
9. Run database migrations
10. Health check verification

### Infrastructure Pipeline
1. Terraform format check
2. Terraform init
3. Terraform validate
4. Terraform plan (post to PR)
5. Manual approval for apply (production)
6. Terraform apply
7. Drift detection (scheduled)

## Security Considerations

### Current Configuration (Demo Mode)
⚠️ **For demonstration purposes only - NOT production-ready:**

- PostgreSQL allows all IP addresses (0.0.0.0/0)
- CORS allows all origins (*)
- Error handler exposes sensitive data in dev mode
- Soft delete purge enabled on Key Vault
- No network isolation or private endpoints

### Production Recommendations

**Network Security:**
- Use Virtual Network integration
- Deploy with private endpoints
- Implement Network Security Groups (NSGs)
- Enable Azure Firewall

**Authentication & Authorization:**
- Implement Azure AD authentication
- Use Managed Identity for service-to-service auth
- Rotate secrets regularly
- Use Azure RBAC for access control

**Data Protection:**
- Enable encryption at rest and in transit
- Implement data retention policies
- Use Azure Backup for disaster recovery
- Enable geo-replication for critical data

**Monitoring & Compliance:**
- Enable Azure Security Center
- Implement Azure Policy for governance
- Use Azure Sentinel for SIEM
- Regular security audits

## Scalability Considerations

### Current Limitations (Demo Tier)
- Single instance App Service (no auto-scale)
- Basic Redis Cache (250 MB, no clustering)
- Burstable PostgreSQL (1 vCore)

### Production Scaling Strategy

**Horizontal Scaling:**
- Auto-scale App Service based on CPU/Memory
- Use Azure Front Door for global distribution
- Implement read replicas for PostgreSQL
- Use Redis cluster mode for cache

**Vertical Scaling:**
- Upgrade App Service to Premium tier
- Increase PostgreSQL to General Purpose tier
- Upgrade Redis to Premium tier with persistence

**Performance Optimization:**
- Implement CDN for static assets
- Use connection pooling
- Implement query result caching
- Optimize database indexes
- Use compression for API responses

## Disaster Recovery

**Backup Strategy:**
- PostgreSQL automated backups (7-day retention)
- Point-in-time restore capability
- Infrastructure as Code for environment recreation
- Application Insights data retention (30 days)

**Recovery Procedures:**
1. Restore database from backup
2. Deploy infrastructure from Terraform
3. Deploy application from latest Docker image
4. Verify health checks
5. Update DNS if needed

**RPO/RTO Targets:**
- Recovery Point Objective (RPO): 24 hours
- Recovery Time Objective (RTO): 4 hours

## Cost Optimization

**Current Monthly Estimate (Dev Environment):**
- App Service Basic (B1): ~$13
- PostgreSQL Flexible Server (B1ms): ~$12
- Redis Cache (Basic C0): ~$17
- Static Web App (Free): $0
- Application Insights: ~$5
- Log Analytics: ~$2
- **Total: ~$49/month**

**Cost Saving Recommendations:**
- Use Azure Dev/Test pricing
- Shut down non-production environments after hours
- Use Azure Reservations for production
- Implement resource tagging for cost tracking
- Review Log Analytics retention policies

## Monitoring Dashboard

**Key Metrics to Display:**

1. **Application Health**
   - Request rate (requests/min)
   - Error rate (%)
   - Average response time (ms)
   - Active users

2. **Infrastructure Health**
   - CPU usage (%)
   - Memory usage (%)
   - Database connections
   - Redis cache hit rate

3. **Business Metrics**
   - Todos created (count)
   - Todos completed (count)
   - Active chaos scenarios
   - Alert frequency

4. **Chaos Engineering**
   - Memory leak progress
   - CPU spike occurrences
   - Connection pool status
   - Unhandled errors count

## References

- [Azure Well-Architected Framework](https://learn.microsoft.com/azure/well-architected/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
