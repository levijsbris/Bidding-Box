variable "project_id" {
  type        = string
  description = "GCP project for the test environment."
}

variable "region" {
  type        = string
  description = "Default region."
  default     = "us-central1"
}

variable "bucket_name" {
  type        = string
  description = "Static hosting bucket name (must be globally unique)."
}
