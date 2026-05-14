variable "billing_account_id" {
  description = "The GCP Billing Account ID"
  type        = string
}

variable "organization_id" {
  description = "The GCP Organization ID"
  type        = string
}

variable "project_id" {
  description = "The GCP Project ID"
  type        = string
  default     = "evms-495723"
}

variable "region" {
  description = "The default GCP region for resources"
  type        = string
  default     = "us-east4" # Often used for FedRAMP workloads
}

variable "zone" {
  description = "The default GCP zone for resources"
  type        = string
  default     = "us-east4-a"
}

variable "database_password" {
  description = "Password for the PostgreSQL database user"
  type        = string
  sensitive   = true
}
