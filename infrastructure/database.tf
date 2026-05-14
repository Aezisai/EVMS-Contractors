# Cloud KMS setup for CMEK (FIPS 140-2 Validated)
resource "google_kms_key_ring" "evms_key_ring" {
  name     = "evms-key-ring"
  location = var.region
  project  = var.project_id

  depends_on = [google_project_service.required_apis]
}

resource "google_kms_crypto_key" "evms_sql_key" {
  name            = "evms-sql-key"
  key_ring        = google_kms_key_ring.evms_key_ring.id
  rotation_period = "7776000s" # 90 Days rotation (NIST recommendation)

  lifecycle {
    prevent_destroy = true
  }
}

# Grant Cloud SQL Service Agent access to use the KMS key
resource "google_project_service_identity" "gcp_sa_cloud_sql" {
  provider = google-beta
  project  = var.project_id
  service  = "sqladmin.googleapis.com"
}

resource "google_kms_crypto_key_iam_binding" "crypto_key" {
  crypto_key_id = google_kms_crypto_key.evms_sql_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:${google_project_service_identity.gcp_sa_cloud_sql.email}",
  ]
}

# Private networking setup for Cloud SQL
resource "google_compute_network" "private_network" {
  name                    = "private-network"
  project                 = var.project_id
  auto_create_subnetworks = false

  depends_on = [google_project_service.required_apis]
}

resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address"
  project       = var.project_id
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.private_network.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.private_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Cloud SQL (PostgreSQL) instance using CMEK
resource "google_sql_database_instance" "evms_postgres" {
  name             = "evms-postgres-instance"
  project          = var.project_id
  region           = var.region
  database_version = "POSTGRES_15"

  # Cloud SQL configuration for CMEK
  encryption_key_name = google_kms_crypto_key.evms_sql_key.id

  settings {
    tier = "db-custom-2-8192" # 2 vCPU, 8GB RAM minimum for prod workload

    ip_configuration {
      ipv4_enabled    = false # Disable public IP for CMMC compliance
      private_network = google_compute_network.private_network.id
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    # Maintenance window
    maintenance_window {
      day  = 7
      hour = 2
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }
    database_flags {
      name  = "log_disconnections"
      value = "on"
    }
  }

  depends_on = [
    google_service_networking_connection.private_vpc_connection,
    google_kms_crypto_key_iam_binding.crypto_key
  ]
}

# Create a database inside the instance
resource "google_sql_database" "evms_db" {
  name     = "evms_db"
  instance = google_sql_database_instance.evms_postgres.name
  project  = var.project_id
}

# Create a default user
resource "google_sql_user" "db_user" {
  name     = "evms_admin"
  instance = google_sql_database_instance.evms_postgres.name
  project  = var.project_id
  password = var.database_password
}
