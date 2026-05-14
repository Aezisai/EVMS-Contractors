# Google Cloud Audit Logs Configuration
# CMMC requires capturing detailed data access and administrative activity.

resource "google_project_iam_audit_config" "project_audit_logs" {
  project = var.project_id
  service = "allServices"

  # Log all admin operations
  audit_log_config {
    log_type = "ADMIN_READ"
  }

  # Log all data read operations (e.g., KMS decrypt, SQL reads)
  audit_log_config {
    log_type = "DATA_READ"
  }

  # Log all data write operations
  audit_log_config {
    log_type = "DATA_WRITE"
  }
}

# Setup an Audit Log sink to retain logs for compliance (CMMC usually requires long retention)
# By default, Admin activity is 400 days, Data access is 30 days. We create a custom bucket config
# or rely on default routing but extend retention on the _Default bucket.
resource "google_logging_project_bucket_config" "default_bucket_retention" {
  project        = var.project_id
  location       = "global"
  retention_days = 365 # 1 year retention for compliance
  bucket_id      = "_Default"
}
