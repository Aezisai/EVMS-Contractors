# VPC Access Connector for Cloud Run to reach private Cloud SQL
resource "google_vpc_access_connector" "microservices_connector" {
  name          = "ms-vpc-connector"
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.private_network.name
  ip_cidr_range = "10.8.0.0/28"
  
  depends_on = [google_project_service.required_apis]
}

# Secret Manager Secrets (Placeholders to be filled manually later)
resource "google_secret_manager_secret" "unanet_api_key" {
  secret_id = "unanet_api_key"
  project   = var.project_id

  replication {
    auto {}
  }
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret" "netsuite_auth_token" {
  secret_id = "netsuite_auth_token"
  project   = var.project_id

  replication {
    auto {}
  }
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret" "quickbooks_oauth" {
  secret_id = "quickbooks_oauth"
  project   = var.project_id

  replication {
    auto {}
  }
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "db_password"
  project   = var.project_id

  replication {
    auto {}
  }
  depends_on = [google_project_service.required_apis]
}

# Cloud Run Services
# Note: For initial deployment, we use a placeholder image. The actual image
# will be deployed via CI/CD later.
locals {
  services = {
    unanet-connector     = "unanet"
    netsuite-connector   = "netsuite"
    quickbooks-connector = "quickbooks"
    evms-engine          = "engine"
  }
}

# Pub/Sub Topic for EVM Alerts
resource "google_pubsub_topic" "evm_alerts" {
  name    = "evm-alerts"
  project = var.project_id
  depends_on = [google_project_service.required_apis]
}

resource "google_cloud_run_v2_service" "microservices" {
  for_each = local.services

  name     = each.key
  location = var.region
  project  = var.project_id

  template {
    containers {
      # Use a basic placeholder image until your CI/CD builds the real one
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      
      env {
        name  = "SERVICE_NAME"
        value = each.value
      }
      
      env {
        name  = "DB_HOST"
        value = google_sql_database_instance.evms_postgres.private_ip_address
      }
    }
    
    vpc_access {
      connector = google_vpc_access_connector.microservices_connector.id
      egress    = "ALL_TRAFFIC"
    }
  }

  ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY" # Prevents public internet access

  depends_on = [
    google_project_service.required_apis,
    google_vpc_access_connector.microservices_connector
  ]
}

# IAM: Allow Cloud Run default service account to access secrets
data "google_compute_default_service_account" "default" {
  project = var.project_id
  depends_on = [google_project_service.required_apis]
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

# IAM: Allow Cloud Run default service account to publish to Pub/Sub
resource "google_pubsub_topic_iam_member" "publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.evm_alerts.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

# Cloud Scheduler Jobs to trigger the microservices nightly
resource "google_cloud_scheduler_job" "nightly_triggers" {
  for_each = local.services

  name        = "trigger-${each.key}"
  description = "Nightly trigger for ${each.key}"
  schedule    = "0 2 * * *" # 2:00 AM daily
  time_zone   = "America/New_York"
  project     = var.project_id
  region      = var.region

  http_target {
    http_method = "POST"
    # Note: the engine expects '/calculate', connectors expect '/ingest/...'
    uri         = each.value == "engine" ? "${google_cloud_run_v2_service.microservices[each.key].uri}/calculate" : "${google_cloud_run_v2_service.microservices[each.key].uri}/ingest/${each.value}"
    
    oidc_token {
      service_account_email = data.google_compute_default_service_account.default.email
    }
  }

  depends_on = [google_project_service.required_apis]
}
