output "bucket_name" {
  value       = google_storage_bucket.site.name
  description = "Name of the static hosting bucket (deploy target)."
}

output "website_url" {
  value       = "https://storage.googleapis.com/${google_storage_bucket.site.name}/index.html"
  description = "Direct bucket URL (a CDN/custom domain fronts this in production)."
}
