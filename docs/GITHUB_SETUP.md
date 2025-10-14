# GitHub Configuration Guide

This guide covers all GitHub configurations needed to enable CI/CD, automated deployments, and Azure SRE Agent integration.

## Required GitHub Secrets

Go to your repository: https://github.com/paulanunes85/sre-demo

Navigate to: **Settings → Secrets and variables → Actions → New repository secret**

### 1. Azure Authentication Secrets

These secrets allow GitHub Actions to authenticate with Azure:

#### `ARM_CLIENT_ID`
- **Description:** Azure Service Principal Application (client) ID
- **How to get:**
```bash
az ad sp create-for-rbac --name "sre-demo-terraform" \
  --role Contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth

# Copy the "clientId" from the output
```

#### `ARM_CLIENT_SECRET`
- **Description:** Azure Service Principal password
- **How to get:** Copy the "clientSecret" from the same command above

#### `ARM_SUBSCRIPTION_ID`
- **Description:** Your Azure Subscription ID
- **How to get:**
```bash
az account show --query id -o tsv
```

#### `ARM_TENANT_ID`
- **Description:** Your Azure AD Tenant ID
- **How to get:** Copy the "tenantId" from the service principal output, or:
```bash
az account show --query tenantId -o tsv
```

#### `AZURE_CREDENTIALS`
- **Description:** Full JSON output for Azure login action
- **How to get:** Copy the ENTIRE JSON output from the `az ad sp create-for-rbac` command:
```json
{
  "clientId": "xxxxx",
  "clientSecret": "xxxxx",
  "subscriptionId": "xxxxx",
  "tenantId": "xxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### 2. Azure Container Registry Secrets

#### `REGISTRY_NAME`
- **Description:** ACR registry name (without .azurecr.io)
- **Example:** `sredemoregistry`
- **How to create ACR:**
```bash
az acr create \
  --resource-group sre-demo-rg \
  --name sredemoregistry \
  --sku Basic \
  --admin-enabled true
```

#### `REGISTRY_USERNAME`
- **Description:** ACR admin username
- **How to get:**
```bash
az acr credential show --name sredemoregistry --query username -o tsv
```

#### `REGISTRY_PASSWORD`
- **Description:** ACR admin password
- **How to get:**
```bash
az acr credential show --name sredemoregistry --query passwords[0].value -o tsv
```

### 3. Database Secrets

#### `POSTGRES_ADMIN_PASSWORD`
- **Description:** PostgreSQL admin password
- **Requirements:** 
  - At least 8 characters
  - Must contain uppercase, lowercase, numbers
  - No special characters that need escaping
- **Example:** `SecurePass123!`
- **⚠️ Important:** This must match the password in your `terraform.tfvars`

### 4. Monitoring Secrets

#### `ALERT_EMAIL`
- **Description:** Email address for Azure Monitor alerts
- **Example:** `your-email@example.com`
- **Note:** You'll receive alerts when chaos scenarios are triggered

### 5. App Service Secrets

These will be available AFTER you deploy infrastructure with Terraform:

#### `AZURE_WEBAPP_NAME_DEV`
- **Description:** Backend App Service name for dev environment
- **How to get:**
```bash
cd terraform
terraform output -raw app_service_name
```
- **Example:** `sre-demo-backend-dev-abc123`

#### `AZURE_WEBAPP_NAME_STAGING`
- **Description:** Backend App Service name for staging (if using)
- **Optional:** Only needed for multi-environment setup

#### `AZURE_WEBAPP_NAME_PROD`
- **Description:** Backend App Service name for production (if using)
- **Optional:** Only needed for multi-environment setup

#### `AZURE_RESOURCE_GROUP`
- **Description:** Azure Resource Group name
- **Example:** `sre-demo-rg`
- **Note:** This should match your `terraform.tfvars`

### 6. Static Web App Secrets

#### `AZURE_STATIC_WEB_APPS_API_TOKEN`
- **Description:** Deployment token for Static Web App
- **How to get:** After deploying infrastructure:
```bash
cd terraform
terraform output -raw static_web_app_api_key
```

#### `VITE_API_BASE_URL`
- **Description:** Backend API URL for frontend
- **How to get:**
```bash
cd terraform
terraform output -raw app_service_url
```
- **Example:** `https://sre-demo-backend-dev-abc123.azurewebsites.net`

## GitHub Secrets Summary Checklist

Copy this checklist and mark as you configure each secret:

```
Azure Authentication:
[ ] ARM_CLIENT_ID
[ ] ARM_CLIENT_SECRET
[ ] ARM_SUBSCRIPTION_ID
[ ] ARM_TENANT_ID
[ ] AZURE_CREDENTIALS

Container Registry:
[ ] REGISTRY_NAME
[ ] REGISTRY_USERNAME
[ ] REGISTRY_PASSWORD

Database:
[ ] POSTGRES_ADMIN_PASSWORD

Monitoring:
[ ] ALERT_EMAIL

App Service (after Terraform):
[ ] AZURE_WEBAPP_NAME_DEV
[ ] AZURE_RESOURCE_GROUP

Static Web App (after Terraform):
[ ] AZURE_STATIC_WEB_APPS_API_TOKEN
[ ] VITE_API_BASE_URL
```

## Step-by-Step Setup Process

### Phase 1: Initial Azure Setup (Before Terraform)

1. **Create Azure Service Principal:**
```bash
az login
az account set --subscription "YOUR_SUBSCRIPTION_NAME"

az ad sp create-for-rbac \
  --name "sre-demo-terraform" \
  --role Contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv) \
  --sdk-auth > azure-credentials.json

# View the credentials
cat azure-credentials.json
```

2. **Create Azure Container Registry:**
```bash
# Create resource group first
az group create --name sre-demo-rg --location eastus

# Create ACR
az acr create \
  --resource-group sre-demo-rg \
  --name sredemoregistry \
  --sku Basic \
  --admin-enabled true

# Get credentials
az acr credential show --name sredemoregistry
```

3. **Add GitHub Secrets (Phase 1):**
- ARM_CLIENT_ID (from azure-credentials.json)
- ARM_CLIENT_SECRET (from azure-credentials.json)
- ARM_SUBSCRIPTION_ID (from azure-credentials.json)
- ARM_TENANT_ID (from azure-credentials.json)
- AZURE_CREDENTIALS (entire JSON from azure-credentials.json)
- REGISTRY_NAME (`sredemoregistry`)
- REGISTRY_USERNAME (from `az acr credential show`)
- REGISTRY_PASSWORD (from `az acr credential show`)
- POSTGRES_ADMIN_PASSWORD (choose a strong password)
- ALERT_EMAIL (your email)
- AZURE_RESOURCE_GROUP (`sre-demo-rg`)

### Phase 2: Deploy Infrastructure

1. **Run Terraform locally or via GitHub Actions:**
```bash
cd terraform

# Initialize
terraform init

# Plan
terraform plan -var-file="terraform.tfvars"

# Apply
terraform apply -var-file="terraform.tfvars"
```

2. **Get outputs:**
```bash
# Save all outputs
terraform output -json > outputs.json

# View specific outputs
terraform output app_service_name
terraform output app_service_url
terraform output static_web_app_api_key
```

### Phase 3: Complete GitHub Secrets

3. **Add remaining GitHub Secrets (Phase 2):**
- AZURE_WEBAPP_NAME_DEV (from Terraform output)
- AZURE_STATIC_WEB_APPS_API_TOKEN (from Terraform output)
- VITE_API_BASE_URL (from Terraform output)

## GitHub Environments Setup

For production deployments with approval gates:

### 1. Create Environments

Go to: **Settings → Environments → New environment**

Create these environments:
- `dev` - No protection rules
- `staging` - Optional: Require reviewers
- `production` - **Required:** Protection rules

### 2. Configure Production Environment

For the `production` environment:

1. **Required reviewers:**
   - Add yourself and/or team members
   - Requires 1 approval before deployment

2. **Wait timer:** (optional)
   - Set to 5 minutes for safety

3. **Deployment branches:**
   - Select "Protected branches only"
   - Only `main` branch can deploy

### 3. Environment Secrets

You can also set environment-specific secrets:

**Dev Environment:**
- Can use default secrets

**Production Environment:**
- Override with production-specific values
- Example: Different database, different app service name

## Branch Protection Rules

Recommended branch protection for `main`:

Go to: **Settings → Branches → Add rule**

Branch name pattern: `main`

Enable:
- ✅ Require a pull request before merging
- ✅ Require approvals (1)
- ✅ Require status checks to pass before merging
  - Select: `terraform-plan`
  - Select: `build-and-test`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

## GitHub Actions Workflows

Your repository has 3 workflows:

### 1. Backend Deploy (`.github/workflows/backend-deploy.yml`)
**Triggers:**
- Push to `main` branch (paths: `backend/**`)
- Manual workflow dispatch

**Jobs:**
- Build and test
- Build Docker image
- Deploy to dev
- Deploy to staging (manual)
- Deploy to production (manual with approval)

### 2. Frontend Deploy (`.github/workflows/frontend-deploy.yml`)
**Triggers:**
- Push to `main` branch (paths: `frontend/**`)
- Manual workflow dispatch

**Jobs:**
- Build and deploy to Azure Static Web Apps

### 3. Infrastructure Deploy (`.github/workflows/infrastructure-deploy.yml`)
**Triggers:**
- Push to `main` branch (paths: `terraform/**`)
- Pull request to `main`
- Manual workflow dispatch
- Scheduled (daily at 9 AM UTC for drift detection)

**Jobs:**
- Terraform plan (always)
- Terraform apply (on main branch push)
- Drift detection (scheduled)
- Terraform destroy (manual only)

## Testing the Setup

### 1. Test Infrastructure Workflow

```bash
# Make a small change to trigger workflow
cd terraform
echo "# Test comment" >> README.md
git add .
git commit -m "Test: Trigger infrastructure workflow"
git push origin main
```

Go to: **Actions** tab and watch the workflow run

### 2. Test Backend Workflow

```bash
# Make a small change
cd backend
echo "// Test comment" >> src/index.ts
git add .
git commit -m "Test: Trigger backend workflow"
git push origin main
```

### 3. Test Frontend Workflow

```bash
# Make a small change
cd frontend
echo "// Test comment" >> src/App.tsx
git add .
git commit -m "Test: Trigger frontend workflow"
git push origin main
```

## Troubleshooting

### Secret Not Found Error

**Error:** `Context access might be invalid: SECRET_NAME`

**Solution:** 
1. Verify secret name exactly matches (case-sensitive)
2. Check secret is in repository secrets, not environment secrets
3. For environment secrets, ensure workflow specifies environment

### Authentication Failed

**Error:** `Error: Login failed with Error: Unable to get credentials`

**Solution:**
1. Verify `AZURE_CREDENTIALS` JSON is valid
2. Check Service Principal has Contributor role
3. Verify subscription ID is correct

### ACR Access Denied

**Error:** `Error: denied: authentication required`

**Solution:**
1. Verify `REGISTRY_USERNAME` and `REGISTRY_PASSWORD`
2. Check ACR admin is enabled: `az acr update --name sredemoregistry --admin-enabled true`
3. Regenerate credentials if needed

### Terraform State Lock

**Error:** `Error acquiring the state lock`

**Solution:**
1. Check if another workflow is running
2. Force unlock (use carefully): `terraform force-unlock LOCK_ID`
3. Consider using remote state backend

## Security Best Practices

### 1. Secret Rotation

Rotate these secrets every 90 days:
- ARM_CLIENT_SECRET
- REGISTRY_PASSWORD
- POSTGRES_ADMIN_PASSWORD

### 2. Least Privilege

- Service Principal should have minimum required permissions
- Consider separate SPs for different environments
- Use Managed Identity where possible

### 3. Audit

- Review Actions logs regularly
- Check who has access to secrets
- Monitor Service Principal usage

### 4. Backup

Keep secure backup of:
- Azure credentials JSON
- All secret values (in password manager)
- Terraform state

## Next Steps

After completing GitHub configuration:

1. ✅ All secrets configured
2. ✅ Environments created
3. ✅ Branch protection enabled
4. 📖 Deploy infrastructure: See [DEPLOYMENT.md](./DEPLOYMENT.md)
5. 📖 Test chaos scenarios: See [CHAOS_SCENARIOS.md](./CHAOS_SCENARIOS.md)
6. 📖 Set up Azure SRE Agent (separate guide)

## Quick Reference Commands

```bash
# View all secrets (names only, not values)
gh secret list

# Set a secret
gh secret set SECRET_NAME

# Delete a secret
gh secret delete SECRET_NAME

# View workflow runs
gh run list

# View specific workflow run
gh run view RUN_ID

# Re-run failed workflow
gh run rerun RUN_ID

# Watch workflow run
gh run watch
```

## Support

For issues:
1. Check GitHub Actions logs
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Verify all secrets are set correctly
4. Check Azure Portal for resource status

## References

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Azure Service Principal](https://learn.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Actions Contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)
