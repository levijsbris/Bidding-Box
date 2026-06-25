terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    prefix = "bridge-table-companion/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "hosting" {
  source = "../../modules/hosting"

  project_id    = var.project_id
  bucket_name   = var.bucket_name
  location      = var.region
  force_destroy = false
}

output "website_url" {
  value = module.hosting.website_url
}
