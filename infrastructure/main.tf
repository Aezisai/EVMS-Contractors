terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project               = var.project_id
  region                = var.region
  zone                  = var.zone
  billing_project       = var.project_id
  user_project_override = true
}

provider "google-beta" {
  project               = var.project_id
  region                = var.region
  zone                  = var.zone
  billing_project       = var.project_id
  user_project_override = true
}

# Assured Workloads configuration for FedRAMP Moderate / IL4
# NOTE: Temporarily commented out due to Google Cloud Billing Quota restrictions on the account.
# resource "google_assured_workloads_workload" "fedramp_moderate" {
#   compliance_regime = "FEDRAMP_MODERATE"
#   display_name      = "EVMS FedRAMP Moderate Workload"
#   location          = "us-east4"
#   organization      = var.organization_id
#   billing_account   = "billingAccounts/${var.billing_account_id}"
# 
#   kms_settings {
#     next_rotation_time = "2025-12-31T23:59:59Z"
#     rotation_period    = "7776000s" # 90 days
#   }
# 
#   depends_on = [google_project_service.required_apis]
# }


# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "identitytoolkit.googleapis.com", # Identity Platform
    "sqladmin.googleapis.com",        # Cloud SQL
    "cloudkms.googleapis.com",        # Cloud KMS
    "logging.googleapis.com",         # Cloud Logging / Audit
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com",
    "run.googleapis.com",             # Cloud Run
    "secretmanager.googleapis.com",   # Secret Manager
    "vpcaccess.googleapis.com",       # Serverless VPC Access
    "cloudscheduler.googleapis.com",  # Cloud Scheduler
    "iam.googleapis.com",             # IAM API
    "pubsub.googleapis.com",          # Pub/Sub API
    "apigateway.googleapis.com",      # API Gateway API
    "servicecontrol.googleapis.com",  # Service Control API
    "servicemanagement.googleapis.com" # Service Management API
  ])

  project = var.project_id
  service = each.key

  disable_on_destroy = false
}
