# Infrastructure (Terraform on GCP)

Reproducible hosting for the static web build. **Today GCP serves only the static
app shell** — the device then runs entirely against local IndexedDB. Cloud
Functions, Firestore, and Secret Manager modules are **deferred** with the
backend milestone (ARCHITECTURE.md §8).

```
infra/terraform/
├─ modules/
│  └─ hosting/        # website-enabled GCS bucket (+ public read)
└─ envs/
   ├─ test/           # shared QA environment
   └─ prod/           # production
```

## Layout

- **One project per environment**; remote, locked state in a GCS bucket
  (`backend "gcs"`, prefix per env).
- Modules deferred for later: `functions`, `firestore`, `secret-manager`, plus
  the Workload Identity pool for GitHub Actions.

## Usage

```bash
cd envs/test
cp terraform.tfvars.example terraform.tfvars   # fill in project_id + bucket_name
terraform init -backend-config="bucket=<state-bucket>"
terraform plan
terraform apply
```

CI authenticates via **Workload Identity Federation** (no long-lived keys); see
`.github/workflows/infra.yml` and `deploy-test.yml`. Those jobs no-op until the
`GCP_PROJECT_ID` repo variable is set.
