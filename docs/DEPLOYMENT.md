# Deployment Guide

This guide provides step-by-step instructions for deploying the Azure SRE Demo application to Azure.

## Prerequisites

### Required Tools

1. **Azure CLI** (2.50+)
   ```bash
   # Install on macOS
   brew install azure-cli
   
   # Verify installation
   az --version
   ```

2. **Terraform** (1.5+)
   ```bash
   # Install on macOS
   brew tap hashicorp/tap
   brew install hashicorp/tap/terraform
   
   # Verify installation
   terraform --version
   ```

3. **Node.js** (20 LTS)
   ```bash
   # Install on macOS
   brew install node@20
   
   # Verify installation
   node --version
   npm --version
   ```

4. **Docker** (24+)
   ```bash
   # Install Docker Desktop from https://www.docker.com/products/docker-desktop/
   
   # Verify installation
   docker --version
   ```

5. **Git**
   ```bash
   # Install on macOS
   brew install git
   
   # Verify installation
   git --version
   ```

### Azure Account Setup

1. **Create Azure Account**
   - Go to https://azure.microsoft.com/free/
   - Sign up for free account ($200 credit)

2. **Login to Azure CLI**
   ```bash
   az login
   ```

3. **Set Default Subscription**
   ```bash
   # List subscriptions
   az account list --output table
   
   # Set active subscription
   az account set --subscription "YOUR_SUBSCRIPTION_ID"
   ```

4. **Create Service Principal for Terraform**
   ```bash
   # Create service principal
   az ad sp create-for-rbac \
     --name "sre-demo-terraform" \
     --role Contributor \
     --scopes /subscriptions/YOUR_SUBSCRIPTION_ID
   
   # Save the output - you'll need these values:
   # - appId (ARM_CLIENT_ID)
   # - password (ARM_CLIENT_SECRET)
   # - tenant (ARM_TENANT_ID)
   ```

5. **Create Azure Container Registry**
   ```bash
   az acr create \
     --resource-group sre-demo-rg \
     --name sredemoregistry \
     --sku Basic \
     --admin-enabled true
   
   # Get credentials
   az acr credential show --name sredemoregistry
   ```

## Environment Configuration

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/sre-demo.git
cd sre-demo
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@host:5432/todoapp
REDIS_CONNECTION_STRING=rediss://default:password@host:6380
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx
```

### 3. Configure Frontend Environment

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=https://your-backend-url.azurewebsites.net
```

### 4. Configure Terraform Variables

```bash
cd ../terraform
```

Create `terraform.tfvars`:
```hcl
project_name         = "sre-demo"
environment          = "dev"
location             = "eastus"
resource_group_name  = "sre-demo-rg"

postgres_admin_username = "adminuser"
postgres_admin_password = "YourSecurePassword123!" # Use strong password!

alert_email = "your-email@example.com"

docker_registry_url = "sredemoregistry.azurecr.io"
docker_image_name   = "sre-demo-backend"
docker_image_tag    = "latest"

tags = {
  Project     = "SRE Demo"
  Owner       = "Your Name"
  Environment = "dev"
}
```

## Deployment Steps

### Step 1: Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment (review changes)
terraform plan \
  -var-file="terraform.tfvars" \
  -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Save outputs
terraform output -json > terraform-outputs.json
```

**Important Outputs:**
- `database_connection_string` - PostgreSQL connection
- `redis_connection_string` - Redis connection
- `app_service_url` - Backend URL
- `static_web_app_url` - Frontend URL
- `application_insights_connection_string` - Monitoring

### Step 2: Build and Deploy Backend

#### Option A: Using GitHub Actions (Recommended)

1. **Configure GitHub Secrets**

Go to your repository → Settings → Secrets and variables → Actions:

```
ARM_CLIENT_ID=<from service principal>
ARM_CLIENT_SECRET=<from service principal>
ARM_SUBSCRIPTION_ID=<your subscription id>
ARM_TENANT_ID=<your tenant id>
POSTGRES_ADMIN_PASSWORD=<your db password>
ALERT_EMAIL=<your email>
REGISTRY_NAME=sredemoregistry
REGISTRY_USERNAME=<from az acr credential show>
REGISTRY_PASSWORD=<from az acr credential show>
AZURE_CREDENTIALS=<service principal JSON>
AZURE_WEBAPP_NAME_DEV=<from terraform output>
AZURE_RESOURCE_GROUP=sre-demo-rg
AZURE_STATIC_WEB_APPS_API_TOKEN=<from terraform output>
VITE_API_BASE_URL=<backend URL from terraform>
```

2. **Trigger Deployment**

```bash
# Push to main branch
git add .
git commit -m "Deploy application"
git push origin main

# Or trigger manually
gh workflow run backend-deploy.yml
gh workflow run frontend-deploy.yml
```

#### Option B: Manual Deployment

1. **Build Backend Docker Image**

```bash
cd backend

# Login to ACR
az acr login --name sredemoregistry

# Build image
docker build -t sredemoregistry.azurecr.io/sre-demo-backend:latest .

# Push image
docker push sredemoregistry.azurecr.io/sre-demo-backend:latest
```

2. **Configure App Service**

```bash
# Get outputs from Terraform
cd ../terraform
WEBAPP_NAME=$(terraform output -raw app_service_name)
DATABASE_URL=$(terraform output -raw database_connection_string)
REDIS_URL=$(terraform output -raw redis_connection_string)
APPINSIGHTS_CS=$(terraform output -raw application_insights_connection_string)

# Configure App Service
az webapp config appsettings set \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL="$DATABASE_URL" \
    REDIS_CONNECTION_STRING="$REDIS_URL" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CS"
```

3. **Deploy to App Service**

```bash
az webapp config container set \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg \
  --docker-custom-image-name sredemoregistry.azurecr.io/sre-demo-backend:latest \
  --docker-registry-server-url https://sredemoregistry.azurecr.io

# Restart App Service
az webapp restart --name $WEBAPP_NAME --resource-group sre-demo-rg
```

4. **Run Database Migrations**

```bash
# SSH into App Service
az webapp ssh --name $WEBAPP_NAME --resource-group sre-demo-rg

# Run migrations
cd /app
npx prisma migrate deploy
npx prisma db seed
exit
```

### Step 3: Deploy Frontend

#### Option A: Using GitHub Actions (Recommended)

```bash
# Already configured in Step 2
# Push triggers automatic deployment
git push origin main
```

#### Option B: Manual Deployment

```bash
cd frontend

# Install dependencies
npm ci

# Build
npm run build

# Deploy to Static Web App
az staticwebapp deploy \
  --name <static-web-app-name> \
  --resource-group sre-demo-rg \
  --app-location "." \
  --output-location "dist" \
  --api-token <deployment-token>
```

### Step 4: Verify Deployment

1. **Check Backend Health**

```bash
BACKEND_URL=$(cd ../terraform && terraform output -raw app_service_url)

# Basic health check
curl $BACKEND_URL/api/health

# Detailed health check
curl $BACKEND_URL/api/health/detailed

# Expected output:
# {"status":"healthy","timestamp":"...","dependencies":{...}}
```

2. **Check Frontend**

```bash
FRONTEND_URL=$(cd ../terraform && terraform output -raw static_web_app_url)

# Open in browser
open $FRONTEND_URL
```

3. **Verify Database Connection**

```bash
# Test todo creation
curl -X POST $BACKEND_URL/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Todo",
    "description": "Testing deployment",
    "priority": "HIGH"
  }'

# List todos
curl $BACKEND_URL/api/todos
```

4. **Check Application Insights**

```bash
# Open Azure Portal
az portal open

# Navigate to Application Insights resource
# Check for incoming telemetry
```

## Post-Deployment Configuration

### 1. Configure Monitoring Alerts

Alerts are automatically created by Terraform, but verify they're working:

```bash
# Test CPU alert
curl -X POST $BACKEND_URL/api/chaos/cpu-spike

# Check Azure Portal → Monitor → Alerts
# Wait 2-3 minutes for alert to fire
```

### 2. Set Up Dashboard

1. Go to Azure Portal → Dashboards
2. Create new dashboard named "SRE Demo Monitoring"
3. Add widgets:
   - Application Insights metrics
   - App Service metrics
   - PostgreSQL metrics
   - Redis metrics
   - Alert summary

### 3. Configure GitHub Integration (for SRE Agent)

This will be set up when you configure Azure SRE Agent:

1. Create GitHub Personal Access Token
2. Configure in Azure Portal
3. Test by triggering chaos scenario
4. Verify GitHub issue creation

## Environment-Specific Deployments

### Development Environment

```bash
terraform apply -var="environment=dev"
```

Features:
- Single instance
- Basic SKUs
- Extended logging
- Public network access

### Staging Environment

```bash
terraform apply -var="environment=staging"
```

Features:
- Same as dev
- Separate database
- Integration testing enabled

### Production Environment

```bash
terraform apply -var="environment=prod"
```

Recommended changes for production:
- Upgrade to Premium SKUs
- Enable auto-scaling
- Implement private endpoints
- Enable geo-replication
- Increase backup retention
- Strict network security

## Rollback Procedures

### Backend Rollback

```bash
# List available images
az acr repository show-tags \
  --name sredemoregistry \
  --repository sre-demo-backend

# Deploy previous version
az webapp config container set \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg \
  --docker-custom-image-name sredemoregistry.azurecr.io/sre-demo-backend:v1.0.0

# Restart
az webapp restart --name $WEBAPP_NAME --resource-group sre-demo-rg
```

### Database Rollback

```bash
# Restore from backup
az postgres flexible-server restore \
  --resource-group sre-demo-rg \
  --name sre-demo-postgres-restored \
  --source-server sre-demo-postgres \
  --restore-time "2024-01-15T10:30:00Z"
```

### Infrastructure Rollback

```bash
# Revert to previous Terraform state
cd terraform
terraform state list
terraform state pull > current-state.json

# Import previous state
terraform state push previous-state.json
terraform apply
```

## Troubleshooting

### Common Issues

#### 1. Deployment Fails - Image Pull Error

```bash
# Check ACR login
az acr check-health --name sredemoregistry

# Verify App Service can access ACR
az webapp config show \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg \
  --query "siteConfig.appSettings"
```

#### 2. Database Connection Failed

```bash
# Test database connectivity
psql "$DATABASE_URL"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group sre-demo-rg \
  --name sre-demo-postgres
```

#### 3. Application Insights Not Receiving Data

```bash
# Verify connection string
az monitor app-insights component show \
  --app sre-demo-appinsights \
  --resource-group sre-demo-rg

# Check App Service configuration
az webapp config appsettings list \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg \
  | grep APPLICATIONINSIGHTS
```

#### 4. Terraform State Lock

```bash
# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

### Debug Commands

```bash
# View App Service logs
az webapp log tail \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg

# View container logs
az webapp log download \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg \
  --log-file app-logs.zip

# SSH into container
az webapp ssh \
  --name $WEBAPP_NAME \
  --resource-group sre-demo-rg
```

## Cleanup

### Delete Everything

```bash
# Destroy infrastructure
cd terraform
terraform destroy -auto-approve

# Or delete resource group
az group delete \
  --name sre-demo-rg \
  --yes \
  --no-wait

# Delete container images
az acr repository delete \
  --name sredemoregistry \
  --repository sre-demo-backend \
  --yes
```

### Delete Specific Resources

```bash
# Delete web app only
terraform destroy -target=azurerm_linux_web_app.backend

# Delete database only (careful!)
terraform destroy -target=azurerm_postgresql_flexible_server.main
```

## Cost Monitoring

```bash
# View cost analysis
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-01-31

# Set budget alert
az consumption budget create \
  --budget-name sre-demo-budget \
  --amount 100 \
  --time-grain Monthly \
  --start-date 2024-01-01 \
  --end-date 2024-12-31
```

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Deploy backend application
3. ✅ Deploy frontend application
4. ✅ Verify health checks
5. ✅ Configure monitoring alerts
6. ✅ Set up dashboard
7. 📖 Review [CHAOS_SCENARIOS.md](./CHAOS_SCENARIOS.md) for demo scenarios
8. 📖 Review [MONITORING.md](./MONITORING.md) for monitoring setup
9. 📖 Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues

## Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review Azure Monitor logs
3. Check GitHub Issues
4. Contact team lead

## References

- [Azure App Service Deployment](https://learn.microsoft.com/azure/app-service/quickstart-nodejs)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
