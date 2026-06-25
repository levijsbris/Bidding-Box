# Static web hosting for the SPA: a website-enabled GCS bucket. Cloud CDN /
# load balancer wiring is added alongside a custom domain. Backend modules
# (Cloud Functions, Firestore) are deferred — ARCHITECTURE.md §8.

resource "google_storage_bucket" "site" {
  name                        = var.bucket_name
  project                     = var.project_id
  location                    = var.location
  uniform_bucket_level_access = true
  force_destroy               = var.force_destroy

  website {
    main_page_suffix = "index.html"
    # SPA fallback: unknown routes serve the app shell.
    not_found_page = "index.html"
  }
}

# Public read for a static site. Tighten to a CDN/LB origin when one is added.
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.site.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
