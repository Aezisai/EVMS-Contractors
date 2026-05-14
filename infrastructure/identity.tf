# Identity Platform Config (replacing Firebase Auth)
resource "google_identity_platform_config" "default" {
  project = var.project_id

  autodelete_anonymous_users = true

  # Enforce MFA
  mfa {
    state = "ENABLED"
  }

  # Allow email/password sign in
  sign_in {
    email {
      enabled           = true
      password_required = true
    }
  }
  
  depends_on = [google_project_service.required_apis]
}


