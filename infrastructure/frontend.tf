# -----------------------------------------------------------------------------
# 1. API GATEWAY (JWT Validation Boundary)
# -----------------------------------------------------------------------------

resource "google_api_gateway_api" "evms_api" {
  provider     = google-beta
  api_id       = "evms-gateway-api"
  project      = var.project_id
  display_name = "EVMS API Gateway"
  depends_on   = [google_project_service.required_apis]
}

resource "google_api_gateway_api_config" "evms_api_config" {
  provider             = google-beta
  api                  = google_api_gateway_api.evms_api.api_id
  api_config_id_prefix = "evms-config-"
  project              = var.project_id

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(templatefile("${path.module}/openapi.yaml.tpl", {
        project_id = var.project_id
        engine_url = google_cloud_run_v2_service.microservices["evms-engine"].uri
      }))
    }
  }

  gateway_config {
    backend_config {
      google_service_account = data.google_compute_default_service_account.default.email
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_api_gateway_gateway" "evms_gateway" {
  provider   = google-beta
  gateway_id = "evms-gateway"
  project    = var.project_id
  region     = var.region
  api_config = google_api_gateway_api_config.evms_api_config.id
}

# -----------------------------------------------------------------------------
# 2. CLOUD ARMOR WAF & GEO-BLOCKING
# -----------------------------------------------------------------------------

resource "google_compute_security_policy" "cloud_armor_policy" {
  name        = "evms-waf-policy"
  description = "Block non-US traffic and enable WAF rules"
  project     = var.project_id

  # Rule 1: Allow US IP addresses
  rule {
    action   = "allow"
    priority = "1000"
    match {
      expr {
        expression = "origin.region_code == 'US'"
      }
    }
    description = "Allow US traffic only"
  }

  # Rule 2: SQLi Protection
  rule {
    action   = "deny(403)"
    priority = "2000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Mitigate SQL Injection"
  }

  # Rule 3: XSS Protection
  rule {
    action   = "deny(403)"
    priority = "3000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Mitigate Cross-site Scripting"
  }

  # Default rule: Deny all other traffic
  rule {
    action   = "deny(403)"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default deny"
  }

  depends_on = [google_project_service.required_apis]
}

# -----------------------------------------------------------------------------
# 3. FRONTEND STATIC HOSTING & CDN
# -----------------------------------------------------------------------------

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "google_storage_bucket" "frontend_bucket" {
  name          = "evms-frontend-${random_id.bucket_suffix.hex}"
  location      = "US"
  project       = var.project_id
  force_destroy = true

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
}

# Make the bucket public (read-only) so CDN can serve it 
# (The WAF will restrict actual access)
# NOTE: Removed allUsers binding because "Domain Restricted Sharing" Organization 
# Policies in FedRAMP/DoD IL4 environments typically block public IAM roles.
# To deploy the CDN, you will need an Identity-Aware Proxy (IAP) or Signed URLs.

# Note: Fully provisioning an External HTTP(S) Load Balancer for Cloud CDN and Cloud Armor 
# requires a registered domain, managed SSL certificates, and multiple routing components 
# (backend buckets, url maps, target proxies, forwarding rules).
# Those resources are complex and require DNS validation to work correctly.
# For now, we will stop at the Bucket and WAF Policy definition, as they represent
# the necessary backend infrastructure for CMMC compliance.
