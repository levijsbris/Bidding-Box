variable "project_id" {
  type        = string
  description = "GCP project that owns the hosting bucket."
}

variable "bucket_name" {
  type        = string
  description = "Globally-unique name for the static hosting bucket."
}

variable "location" {
  type        = string
  description = "Bucket location."
  default     = "US"
}

variable "force_destroy" {
  type        = bool
  description = "Allow deleting a non-empty bucket (handy for ephemeral envs)."
  default     = false
}
