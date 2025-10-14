# 🔥 Chaos Engineering Scenarios

This document provides detailed instructions for triggering and demonstrating each intentional bug/issue in the SRE Demo platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Scenario 1: Memory Leak](#scenario-1-memory-leak)
- [Scenario 2: N+1 Query Problem](#scenario-2-n1-query-problem)
- [Scenario 3: Missing Database Index](#scenario-3-missing-database-index)
- [Scenario 4: Redis Connection Pool Exhaustion](#scenario-4-redis-connection-pool-exhaustion)
- [Scenario 5: Unhandled Promise Rejection](#scenario-5-unhandled-promise-rejection)
- [Scenario 6: CPU Intensive Loop](#scenario-6-cpu-intensive-loop)
- [Scenario 7: Database Connection Timeout](#scenario-7-database-connection-timeout)
- [Scenario 8: Cache Invalidation Bug](#scenario-8-cache-invalidation-bug)
- [Scenario 9: Missing Error Handling](#scenario-9-missing-error-handling)
- [Scenario 10: Infrastructure Drift](#scenario-10-infrastructure-drift)

## Overview

Each scenario is designed to trigger specific Azure Monitor alerts and demonstrate how Azure SRE Agent detects, reports, and can help resolve issues.

**⚠️ WARNING**: These scenarios are for demonstration purposes only. Do not enable them in production environments.

## Prerequisites

- Application deployed to Azure
- Azure Monitor and Application Insights configured
- Alert rules active
- GitHub repository connected to Azure SRE Agent
- Postman or curl for API testing

## Scenario 1: Memory Leak

### Description
Simulates a gradual memory leak that will eventually cause the application to crash or restart.

### Severity
🔴 **High** - Can cause application downtime

### Expected Alerts
- High Memory Usage (>85%)
- Application Restart Detected
- Out of Memory Error

### How to Trigger

```bash
# Enable memory leak in the application
curl -X POST https://your-app.azurewebsites.net/api/chaos/memory-leak/enable

# Trigger the leak (creates objects that are never garbage collected)
curl -X POST https://your-app.azurewebsites.net/api/chaos/memory-leak/trigger

# Monitor memory usage
curl https://your-app.azurewebsites.net/api/health/memory
```

### Expected Behavior

1. **T+0 min**: Memory usage starts at normal levels (~100MB)
2. **T+2 min**: Memory usage increases to 300MB
3. **T+5 min**: Memory usage hits 500MB - First alert triggered
4. **T+8 min**: Memory usage exceeds 85% - Critical alert
5. **T+10 min**: Application may become unresponsive
6. **T+12 min**: Application crashes or restarts

### Azure SRE Agent Actions

- Creates GitHub Issue: "High Memory Usage Detected"
- Suggests code fixes in the issue
- Links to Application Insights metrics
- Recommends immediate remediation

### How to Disable

```bash
curl -X POST https://your-app.azurewebsites.net/api/chaos/memory-leak/disable
```

### Code Location
`backend/src/controllers/chaosController.ts` - Line 45-78

---

## Scenario 2: N+1 Query Problem

### Description
Executes inefficient database queries that fetch todos and then make individual queries for each todo's metadata.

### Severity
🟡 **Medium** - Performance degradation

### Expected Alerts
- Slow Response Time (>2s average)
- High Database Connection Count
- Database CPU Spike

### How to Trigger

```bash
# Create test data (100 todos)
curl -X POST https://your-app.azurewebsites.net/api/chaos/seed-data \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'

# Trigger N+1 query (fetches todos inefficiently)
curl "https://your-app.azurewebsites.net/api/todos?inefficient=true"
```

### Expected Behavior

1. **T+0 sec**: Request initiated
2. **T+1 sec**: 1 query to fetch all todos
3. **T+2-5 sec**: 100 individual queries for metadata (N+1 problem)
4. **T+5+ sec**: Response finally returned
5. **Alert**: Average response time > 2 seconds

### Comparison

**Efficient Query** (with eager loading):
```bash
curl "https://your-app.azurewebsites.net/api/todos"
# Response time: ~100ms
```

**Inefficient Query** (N+1 problem):
```bash
curl "https://your-app.azurewebsites.net/api/todos?inefficient=true"
# Response time: ~5000ms
```

### Azure SRE Agent Actions

- Creates Issue: "Database Performance Degradation Detected"
- Suggests adding proper joins/eager loading
- Links to slow query logs in Application Insights
- Provides code example with fix

### How to Fix

The agent will suggest changing from:
```typescript
// BAD: N+1 queries
const todos = await prisma.todo.findMany();
for (const todo of todos) {
  const metadata = await prisma.metadata.findUnique({ where: { todoId: todo.id }});
}
```

To:
```typescript
// GOOD: Single query with join
const todos = await prisma.todo.findMany({
  include: { metadata: true }
});
```

### Code Location
`backend/src/controllers/todoController.ts` - Line 120-145

---

## Scenario 3: Missing Database Index

### Description
Performs search queries on unindexed columns, causing full table scans.

### Severity
🟡 **Medium** - Performance degradation under load

### Expected Alerts
- Slow Query Performance
- High Database CPU
- Increased Response Latency

### How to Trigger

```bash
# Ensure you have test data
curl -X POST https://your-app.azurewebsites.net/api/chaos/seed-data \
  -H "Content-Type: application/json" \
  -d '{"count": 1000}'

# Perform search on unindexed column
curl "https://your-app.azurewebsites.net/api/todos/search?q=meeting"
```

### Expected Behavior

1. Full table scan on 1000+ records
2. Query execution time > 1 second
3. Database CPU usage spike
4. Slow response time alert triggered

### Load Testing

```bash
# Run concurrent searches to amplify the issue
for i in {1..50}; do
  curl "https://your-app.azurewebsites.net/api/todos/search?q=test$i" &
done
wait
```

### Azure SRE Agent Actions

- Creates Issue: "Missing Database Index Detected"
- Suggests adding index on search columns
- Provides Prisma migration code
- Links to PostgreSQL query execution plans

### Recommended Fix

```prisma
// Add to schema.prisma
model Todo {
  // ... existing fields
  @@index([title])
  @@index([description])
}
```

### Code Location
- `backend/src/controllers/todoController.ts` - Line 180-195
- `backend/prisma/schema.prisma` - Line 15-25

---

## Scenario 4: Redis Connection Pool Exhaustion

### Description
Creates numerous Redis connections without proper pooling, exhausting available connections.

### Severity
🔴 **Critical** - Can cause complete service unavailability

### Expected Alerts
- Redis Connection Errors
- Application Errors Spike
- Service Unavailable (503)

### How to Trigger

```bash
# Trigger connection pool exhaustion
curl -X POST https://your-app.azurewebsites.net/api/chaos/exhaust-pool

# Observe errors in subsequent requests
curl https://your-app.azurewebsites.net/api/todos
# Should return 500 or 503 errors
```

### Expected Behavior

1. **T+0 sec**: Connection pool starts normal (10 connections)
2. **T+5 sec**: 50+ connections created without reuse
3. **T+10 sec**: Redis max connections reached (default 10000)
4. **T+15 sec**: New requests fail with "Too many connections"
5. **Alert**: Critical - Service unavailable

### Monitoring

```bash
# Check Redis connection count
redis-cli -h your-redis.redis.cache.windows.net INFO clients
```

### Azure SRE Agent Actions

- Creates Critical Issue: "Redis Connection Pool Exhausted"
- Suggests implementing connection pooling
- Recommends immediate service restart
- Provides configuration examples

### How to Recover

```bash
# Option 1: Restart application
az webapp restart --name your-app --resource-group your-rg

# Option 2: Disable chaos scenario
curl -X POST https://your-app.azurewebsites.net/api/chaos/exhaust-pool/disable
```

### Code Location
`backend/src/services/redisService.ts` - Line 65-88

---

## Scenario 5: Unhandled Promise Rejection

### Description
Triggers async operations that fail without proper error handling, causing uncaught promise rejections.

### Severity
🔴 **High** - Can cause application crashes

### Expected Alerts
- Unhandled Exception Detected
- Application Crash/Restart
- Error Rate Spike

### How to Trigger

```bash
# Trigger unhandled promise rejection
curl -X POST https://your-app.azurewebsites.net/api/chaos/unhandled-promise
```

### Expected Behavior

1. Async operation initiated
2. Operation fails without try/catch
3. Unhandled rejection logged to console
4. Node.js process may crash (depending on version)
5. Application restarts automatically

### Console Output

```
(node:1234) UnhandledPromiseRejectionWarning: Unhandled promise rejection.
(node:1234) UnhandledPromiseRejectionWarning: Unhandled promise rejection detected
(node:1234) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated
```

### Azure SRE Agent Actions

- Creates Issue: "Unhandled Promise Rejection Detected"
- Highlights code location
- Suggests adding try/catch blocks
- Recommends global error handlers

### Recommended Fix

```typescript
// BAD: No error handling
async function riskyOperation() {
  await someAsyncOperation(); // Can throw
}

// GOOD: Proper error handling
async function safeOperation() {
  try {
    await someAsyncOperation();
  } catch (error) {
    logger.error('Operation failed', error);
    throw error; // Re-throw if needed
  }
}
```

### Code Location
`backend/src/controllers/chaosController.ts` - Line 125-140

---

## Scenario 6: CPU Intensive Loop

### Description
Executes a CPU-intensive synchronous loop that blocks the event loop.

### Severity
🔴 **Critical** - Causes complete service unresponsiveness

### Expected Alerts
- High CPU Usage (>90%)
- Response Time Spike
- Health Check Failures

### How to Trigger

```bash
# Trigger CPU spike (blocks event loop for 30 seconds)
curl -X POST https://your-app.azurewebsites.net/api/chaos/cpu-spike
```

### Expected Behavior

1. **T+0 sec**: CPU usage spikes to 100%
2. **T+0-30 sec**: All requests blocked (event loop blocked)
3. **T+30 sec**: Operation completes, normal service resumes
4. **Alert**: Critical CPU usage + Health check failures

### Impact Demonstration

```bash
# Terminal 1: Trigger CPU spike
curl -X POST https://your-app.azurewebsites.net/api/chaos/cpu-spike

# Terminal 2: Try other requests (will hang)
curl https://your-app.azurewebsites.net/api/todos
# This will timeout or take 30+ seconds
```

### Azure SRE Agent Actions

- Creates Critical Issue: "High CPU Usage - Event Loop Blocked"
- Suggests offloading work to worker threads
- Recommends async processing
- Provides refactoring examples

### Recommended Fix

```typescript
// BAD: Blocks event loop
function cpuIntensiveTask() {
  for (let i = 0; i < 1000000000; i++) {
    Math.sqrt(i);
  }
}

// GOOD: Use worker threads
import { Worker } from 'worker_threads';

function cpuIntensiveTaskAsync() {
  return new Promise((resolve) => {
    const worker = new Worker('./cpuWorker.js');
    worker.on('message', resolve);
  });
}
```

### Code Location
`backend/src/controllers/chaosController.ts` - Line 165-185

---

## Scenario 7: Database Connection Timeout

### Description
Holds database connections open for extended periods, causing timeouts for other requests.

### Severity
🔴 **High** - Causes request failures

### Expected Alerts
- Database Connection Timeout
- Failed Requests Spike
- Database Pool Exhaustion

### How to Trigger

```bash
# Start long-running transaction (holds connection for 60 seconds)
curl -X POST https://your-app.azurewebsites.net/api/chaos/db-timeout

# Try other database operations (will timeout)
curl https://your-app.azurewebsites.net/api/todos
```

### Expected Behavior

1. Long transaction started, connection held
2. Connection pool exhausted (default 10 connections)
3. New requests wait for available connection
4. After timeout (30s), requests fail
5. After 60s, original connection released

### Load Testing

```bash
# Start 20 long transactions to exhaust pool
for i in {1..20}; do
  curl -X POST https://your-app.azurewebsites.net/api/chaos/db-timeout &
done

# All subsequent requests will fail
curl https://your-app.azurewebsites.net/api/todos
# Error: Connection timeout
```

### Azure SRE Agent Actions

- Creates Issue: "Database Connection Pool Exhausted"
- Suggests implementing connection timeouts
- Recommends reviewing long-running queries
- Provides Prisma configuration improvements

### Recommended Fix

```typescript
// Configure proper timeouts in Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Add connection pool configuration
  connection_limit = 20
  pool_timeout     = 30
  connect_timeout  = 10
}
```

### Code Location
`backend/src/controllers/chaosController.ts` - Line 210-235

---

## Scenario 8: Cache Invalidation Bug

### Description
Updates database without invalidating corresponding cache entries, causing stale data.

### Severity
🟡 **Medium** - Data integrity issue

### Expected Alerts
- Data Inconsistency Detected
- Cache Hit Ratio Anomaly

### How to Trigger

```bash
# Create a todo (cached)
RESPONSE=$(curl -X POST https://your-app.azurewebsites.net/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Todo", "completed": false}')

TODO_ID=$(echo $RESPONSE | jq -r '.id')

# Get todo (from cache)
curl https://your-app.azurewebsites.net/api/todos/$TODO_ID
# Response: {"title": "Test Todo", "completed": false}

# Update todo WITHOUT cache invalidation
curl -X PUT "https://your-app.azurewebsites.net/api/todos/$TODO_ID?skipCache=true" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Todo", "completed": true}'

# Get todo again (returns stale cached data)
curl https://your-app.azurewebsites.net/api/todos/$TODO_ID
# Response: {"title": "Test Todo", "completed": false} ❌ STALE!
```

### Expected Behavior

1. Database updated successfully
2. Cache NOT invalidated
3. Subsequent reads return stale data
4. Data inconsistency persists until cache expires (TTL: 1 hour)

### Verification

```bash
# Check database directly
curl "https://your-app.azurewebsites.net/api/todos/$TODO_ID?nocache=true"
# Response: {"title": "Updated Todo", "completed": true} ✅ FRESH

# Check cache
curl https://your-app.azurewebsites.net/api/todos/$TODO_ID
# Response: {"title": "Test Todo", "completed": false} ❌ STALE
```

### Azure SRE Agent Actions

- Creates Issue: "Cache Invalidation Bug Detected"
- Suggests adding cache invalidation logic
- Recommends cache-aside pattern implementation
- Provides code examples

### Recommended Fix

```typescript
// Add proper cache invalidation
async function updateTodo(id: string, data: UpdateTodoDto) {
  // Update database
  const updated = await prisma.todo.update({
    where: { id },
    data
  });
  
  // Invalidate cache
  await redis.del(`todo:${id}`);
  await redis.del('todos:list');
  
  return updated;
}
```

### Code Location
`backend/src/controllers/todoController.ts` - Line 260-285

---

## Scenario 9: Missing Error Handling

### Description
Endpoints that don't handle errors properly, exposing sensitive information or causing crashes.

### Severity
🟡 **Medium** - Security and reliability issue

### Expected Alerts
- Unhandled Exception
- 500 Internal Server Error Spike
- Sensitive Information Exposure

### How to Trigger

```bash
# Send malformed JSON
curl -X POST https://your-app.azurewebsites.net/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": null, "completed": "not-a-boolean"}'

# Response exposes stack trace and database details ❌
```

### Expected Behavior

1. Validation fails
2. Error not caught properly
3. Full stack trace returned to client
4. Database connection string may be exposed
5. Application may crash

### Example Error Response (BAD)

```json
{
  "error": "TypeError: Cannot read property 'title' of null",
  "stack": "at TodoController.create (/app/src/controllers/todoController.ts:45:12)...",
  "database": "postgresql://user:password@host:5432/db",
  "environment": "production"
}
```

### Azure SRE Agent Actions

- Creates Issue: "Missing Error Handling - Security Risk"
- Suggests implementing error middleware
- Recommends input validation
- Highlights sensitive data exposure

### Recommended Fix

```typescript
// Add global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  // Don't expose details in production
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id
  });
});

// Add input validation
import { z } from 'zod';

const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  completed: z.boolean().default(false)
});
```

### Code Location
`backend/src/controllers/todoController.ts` - Line 310-330

---

## Scenario 10: Infrastructure Drift

### Description
Manual changes made to Azure resources outside of Terraform, causing configuration drift.

### Severity
🟡 **Low** - Configuration management issue

### Expected Alerts
- Terraform Drift Detected
- Configuration Mismatch
- Security Group Changes

### How to Trigger

```bash
# Make manual change via Azure Portal or CLI
az postgres flexible-server update \
  --name your-postgres-server \
  --resource-group your-rg \
  --sku-name Standard_B2s  # Different from Terraform config

# Or change network rules
az postgres flexible-server firewall-rule create \
  --name allow-all \
  --resource-group your-rg \
  --server-name your-postgres-server \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

### Detection

Drift detection runs automatically via GitHub Actions:

```bash
# Manual drift detection
cd terraform/environments/dev
terraform plan -detailed-exitcode

# Exit code 2 = drift detected
```

### Expected Behavior

1. Manual change made in Azure Portal
2. Drift detection job runs (scheduled or on-demand)
3. Terraform plan shows differences
4. GitHub Issue created with drift details
5. Pull request suggested with corrections

### Azure SRE Agent Actions

- Creates Issue: "Infrastructure Drift Detected"
- Shows Terraform plan output
- Suggests either:
  - Reverting manual changes, or
  - Updating Terraform code to match
- Provides import commands if needed

### Example Drift Report

```hcl
# azurerm_postgresql_flexible_server.main will be updated in-place
~ resource "azurerm_postgresql_flexible_server" "main" {
    id     = "/subscriptions/.../postgresqlServer"
    name   = "todo-postgres-dev"
    
    # Drift detected:
  ~ sku_name = "Standard_B1ms" -> "Standard_B2s"
}
```

### Recommended Fix

```bash
# Option 1: Revert manual change
az postgres flexible-server update \
  --name your-postgres-server \
  --resource-group your-rg \
  --sku-name Standard_B1ms

# Option 2: Update Terraform
# Edit terraform/modules/database/main.tf
sku_name = "Standard_B2s"

# Apply changes
terraform apply
```

### Code Location
- `.github/workflows/infrastructure-drift.yml`
- `terraform/environments/dev/main.tf`

---

## Monitoring Dashboard

All scenarios can be monitored in real-time using the Azure Dashboard:

```bash
# Open Application Insights
az portal show --name your-app-insights --resource-group your-rg
```

### Key Metrics to Watch

- **Response Time**: Should spike during performance scenarios
- **Error Rate**: Should increase during error scenarios
- **Memory Usage**: Should climb during memory leak scenario
- **CPU Usage**: Should spike during CPU intensive scenario
- **Database Connections**: Should exhaust during connection scenarios
- **Cache Hit Ratio**: Should show anomalies during cache scenarios

## Quick Reference

### Enable All Chaos Scenarios

```bash
curl -X POST https://your-app.azurewebsites.net/api/chaos/enable-all
```

### Disable All Chaos Scenarios

```bash
curl -X POST https://your-app.azurewebsites.net/api/chaos/disable-all
```

### Check Chaos Status

```bash
curl https://your-app.azurewebsites.net/api/chaos/status
```

### Reset Demo Environment

```bash
curl -X POST https://your-app.azurewebsites.net/api/chaos/reset
```

---

## Presentation Tips

### Demo Flow

1. **Introduction** (5 min)
   - Show healthy application state
   - Review monitoring dashboard
   - Explain alert configuration

2. **Trigger Scenario** (2 min)
   - Choose one scenario
   - Execute trigger command
   - Explain expected impact

3. **Observe Detection** (5 min)
   - Watch alerts fire
   - Show metrics in Application Insights
   - Demonstrate dashboard updates

4. **Azure SRE Agent Action** (3 min)
   - Show GitHub issue created
   - Review agent suggestions
   - Highlight code recommendations

5. **Resolution** (5 min)
   - Request Copilot to fix issue
   - Review proposed changes
   - Verify fix resolves problem

### Best Practices

- ✅ Start with less severe scenarios (cache, index)
- ✅ Progress to more critical scenarios (memory, CPU)
- ✅ Always show before/after metrics
- ✅ Explain business impact of each issue
- ✅ Highlight automatic detection value
- ✅ Demonstrate fix suggestions quality

### Common Questions

**Q: Are these real production issues?**  
A: Yes, based on actual incidents we've seen in production systems.

**Q: How long until alerts fire?**  
A: Typically 1-5 minutes depending on alert configuration.

**Q: Can I safely run these in production?**  
A: No! These are for demo environments only.

**Q: How do I clean up after demos?**  
A: Use the reset endpoint or disable all chaos scenarios.

---

**Need Help?** Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide or create an issue.
