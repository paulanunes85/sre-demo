variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "centralus"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "sre-demo"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "SRE Demo"
    ManagedBy   = "Terraform"
    Purpose     = "Azure SRE Agent Demonstration"
  }
}

# Database Configuration
variable "postgres_sku_name" {
  description = "PostgreSQL SKU name"
  type        = string
  default     = "B_Standard_B1ms" # Small SKU for demo
}

variable "postgres_storage_mb" {
  description = "PostgreSQL storage size in MB"
  type        = number
  default     = 32768 # 32 GB
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
}

variable "postgres_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "psqladmin"
  sensitive   = true
}

variable "postgres_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_sku_name" {
  description = "Redis cache SKU name"
  type        = string
  default     = "Basic"
}

variable "redis_family" {
  description = "Redis cache family"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Redis cache capacity"
  type        = number
  default     = 0 # 250 MB for Basic C0
}

# App Service Configuration
variable "app_service_sku_name" {
  description = "App Service plan SKU"
  type        = string
  default     = "B1" # Basic tier for demo
}

variable "docker_registry_url" {
  description = "Docker registry URL"
  type        = string
  default     = "ghcr.io"
}

variable "docker_image_name" {
  description = "Docker image name"
  type        = string
  default     = "your-org/sre-demo-backend"
}

variable "docker_image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

# Monitoring Configuration
variable "log_analytics_retention_days" {
  description = "Log Analytics workspace retention in days"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
}

# Static Web App Configuration
variable "frontend_location" {
  description = "Static Web App location"
  type        = string
  default     = "centralus"
}
