# Generate random suffix for unique naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  name_suffix = "${var.environment}-${random_string.suffix.result}"
  common_tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.common_tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-logs-${local.name_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_analytics_retention_days
  tags                = local.common_tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-appinsights-${local.name_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.common_tags
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.project_name}-postgres-${local.name_suffix}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = var.postgres_version
  administrator_login    = var.postgres_admin_username
  administrator_password = var.postgres_admin_password
  
  storage_mb = var.postgres_storage_mb
  sku_name   = var.postgres_sku_name
  
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
  
  # INTENTIONAL: Allow public access for demo purposes
  # In production, use private endpoints
  public_network_access_enabled = true
  
  tags = local.common_tags
}

# PostgreSQL Firewall Rule - Allow Azure Services
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# PostgreSQL Firewall Rule - Allow all (for demo only!)
# INTENTIONAL: Security risk for demonstration purposes
resource "azurerm_postgresql_flexible_server_firewall_rule" "all" {
  name             = "AllowAll"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "todoapp"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-redis-${local.name_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  
  redis_configuration {
    enable_authentication = true
  }
  
  tags = local.common_tags
}

# Key Vault
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                = "${var.project_name}-kv-${local.name_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
  
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    
    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge"
    ]
  }
  
  tags = local.common_tags
}

# Store secrets in Key Vault
resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-connection-string"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "app_insights_connection_string" {
  name         = "app-insights-connection-string"
  value        = azurerm_application_insights.main.connection_string
  key_vault_id = azurerm_key_vault.main.id
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-plan-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku_name
  
  tags = local.common_tags
}

# Linux Web App (Backend)
resource "azurerm_linux_web_app" "backend" {
  name                = "${var.project_name}-backend-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.main.location
  service_plan_id     = azurerm_service_plan.main.id
  
  https_only = true
  
  site_config {
    always_on = true
    
    application_stack {
      docker_image_name   = "${var.docker_image_name}:${var.docker_image_tag}"
      docker_registry_url = "https://${var.docker_registry_url}"
    }
    
    health_check_path = "/api/health"
    
    cors {
      allowed_origins = ["*"] # INTENTIONAL: Too permissive for demo
    }
  }
  
  app_settings = {
    "NODE_ENV"                              = var.environment
    "PORT"                                  = "3000"
    "DATABASE_URL"                          = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.database_url.id})"
    "REDIS_CONNECTION_STRING"               = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.redis_connection_string.id})"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
    "WEBSITES_PORT"                         = "3000"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE"   = "false"
    "DOCKER_ENABLE_CI"                      = "true"
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  logs {
    application_logs {
      file_system_level = "Information"
    }
    
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }
  
  tags = local.common_tags
}

# Grant Web App access to Key Vault
resource "azurerm_key_vault_access_policy" "web_app" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = azurerm_linux_web_app.backend.identity[0].tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id
  
  secret_permissions = [
    "Get", "List"
  ]
}

# Static Web App (Frontend)
resource "azurerm_static_web_app" "frontend" {
  name                = "${var.project_name}-frontend-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.frontend_location
  sku_tier            = "Free"
  sku_size            = "Free"
  
  tags = local.common_tags
}

# Monitor Action Group for Alerts
resource "azurerm_monitor_action_group" "main" {
  name                = "${var.project_name}-action-group-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "SREDemo"
  
  email_receiver {
    name          = "admin"
    email_address = var.alert_email
  }
  
  tags = local.common_tags
}

# Metric Alert: High CPU
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "${var.project_name}-high-cpu-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alert when CPU usage is above 80%"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  
  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }
  
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }
  
  tags = local.common_tags
}

# Metric Alert: High Memory
resource "azurerm_monitor_metric_alert" "high_memory" {
  name                = "${var.project_name}-high-memory-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alert when memory usage is above 85%"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  
  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "MemoryPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }
  
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }
  
  tags = local.common_tags
}

# Metric Alert: HTTP Server Errors
resource "azurerm_monitor_metric_alert" "http_errors" {
  name                = "${var.project_name}-http-errors-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alert when HTTP 5xx errors exceed 10 per minute"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"
  
  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10
  }
  
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }
  
  tags = local.common_tags
}

# Metric Alert: Response Time
resource "azurerm_monitor_metric_alert" "slow_response" {
  name                = "${var.project_name}-slow-response-${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alert when average response time exceeds 2 seconds"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  
  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "ResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 2
  }
  
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }
  
  tags = local.common_tags
}

# Diagnostic Settings for Web App
resource "azurerm_monitor_diagnostic_setting" "web_app" {
  name                       = "web-app-diagnostics"
  target_resource_id         = azurerm_linux_web_app.backend.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  enabled_log {
    category = "AppServiceHTTPLogs"
  }
  
  enabled_log {
    category = "AppServiceConsoleLogs"
  }
  
  enabled_log {
    category = "AppServiceAppLogs"
  }
  
  metric {
    category = "AllMetrics"
  }
}

# Diagnostic Settings for PostgreSQL
resource "azurerm_monitor_diagnostic_setting" "postgres" {
  name                       = "postgres-diagnostics"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  enabled_log {
    category = "PostgreSQLLogs"
  }
  
  metric {
    category = "AllMetrics"
  }
}

# Diagnostic Settings for Redis
resource "azurerm_monitor_diagnostic_setting" "redis" {
  name                       = "redis-diagnostics"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  enabled_log {
    category = "ConnectedClientList"
  }
  
  metric {
    category = "AllMetrics"
  }
}
