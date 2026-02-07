#!/usr/bin/env bash
set -euo pipefail

#
# Deploy Speaking Meeting Bot to GCP Cloud Run
#
# Prerequisites:
#   1. gcloud CLI installed and authenticated: gcloud auth login
#   2. GCP project with billing enabled
#   3. Enable required APIs:
#        gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com
#   4. Create Artifact Registry repository (once):
#        gcloud artifacts repositories create meeting-bot --repository-format=docker --location=us-central1
#   5. Create secrets in Secret Manager (once):
#        echo -n "your-key" | gcloud secrets create MEETING_BAAS_API_KEY --data-file=-
#        echo -n "your-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
#        echo -n "your-key" | gcloud secrets create CARTESIA_API_KEY --data-file=-
#        echo -n "your-key" | gcloud secrets create DEEPGRAM_API_KEY --data-file=-
#
# Usage:
#   ./scripts/deploy_gcp.sh                          # Deploy both services
#   ./scripts/deploy_gcp.sh --backend-only            # Deploy backend only
#   ./scripts/deploy_gcp.sh --frontend-only           # Deploy frontend only
#

# ─── Configuration ───────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-us-central1}"
REPO="meeting-bot"
BACKEND_SERVICE="meeting-bot-backend"
FRONTEND_SERVICE="meeting-bot-frontend"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

# ─── Parse arguments ────────────────────────────────────────────────────────
DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true

for arg in "$@"; do
  case $arg in
    --backend-only)  DEPLOY_FRONTEND=false ;;
    --frontend-only) DEPLOY_BACKEND=false ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

echo "=== GCP Cloud Run Deployment ==="
echo "Project:  ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo "Registry: ${REGISTRY}"
echo ""

# ─── Deploy Backend ─────────────────────────────────────────────────────────
if [ "$DEPLOY_BACKEND" = true ]; then
  echo ">>> Building backend image..."
  gcloud builds submit \
    --tag "${REGISTRY}/${BACKEND_SERVICE}" \
    --timeout=1200 \
    .

  echo ">>> Deploying backend to Cloud Run..."
  gcloud run deploy "${BACKEND_SERVICE}" \
    --image "${REGISTRY}/${BACKEND_SERVICE}" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --min-instances=1 \
    --max-instances=1 \
    --memory=2Gi \
    --cpu=2 \
    --timeout=3600 \
    --concurrency=100 \
    --session-affinity \
    --set-secrets="MEETING_BAAS_API_KEY=MEETING_BAAS_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,CARTESIA_API_KEY=CARTESIA_API_KEY:latest,DEEPGRAM_API_KEY=DEEPGRAM_API_KEY:latest" \
    --set-env-vars="PORT=7014"

  BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
    --region "${REGION}" \
    --format="value(status.url)")

  echo ""
  echo "Backend deployed: ${BACKEND_URL}"

  # Update BASE_URL so the backend knows its own public URL
  gcloud run services update "${BACKEND_SERVICE}" \
    --region "${REGION}" \
    --update-env-vars="BASE_URL=${BACKEND_URL}"

  echo "Backend BASE_URL set to: ${BACKEND_URL}"
  echo ""
fi

# ─── Deploy Frontend ────────────────────────────────────────────────────────
if [ "$DEPLOY_FRONTEND" = true ]; then
  # Resolve backend URL if not already set
  if [ -z "${BACKEND_URL:-}" ]; then
    BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
      --region "${REGION}" \
      --format="value(status.url)")
  fi

  WS_URL="${BACKEND_URL/https:/wss:}"

  echo ">>> Building frontend image..."
  echo "    API URL: ${BACKEND_URL}"
  echo "    WS URL:  ${WS_URL}"

  gcloud builds submit \
    --tag "${REGISTRY}/${FRONTEND_SERVICE}" \
    --timeout=1200 \
    --substitutions="_NEXT_PUBLIC_API_URL=${BACKEND_URL},_NEXT_PUBLIC_WS_URL=${WS_URL}" \
    web/

  # Cloud Build doesn't pass substitutions as build args by default,
  # so we use a manual docker build via cloudbuild.yaml if needed.
  # For simplicity, we build locally and push instead:
  echo ">>> Building frontend with build args..."
  docker build \
    --build-arg "NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
    --build-arg "NEXT_PUBLIC_WS_URL=${WS_URL}" \
    --build-arg "NEXT_PUBLIC_MEETING_BAAS_API_KEY=${NEXT_PUBLIC_MEETING_BAAS_API_KEY:-}" \
    -t "${REGISTRY}/${FRONTEND_SERVICE}" \
    web/

  echo ">>> Pushing frontend image..."
  docker push "${REGISTRY}/${FRONTEND_SERVICE}"

  echo ">>> Deploying frontend to Cloud Run..."
  gcloud run deploy "${FRONTEND_SERVICE}" \
    --image "${REGISTRY}/${FRONTEND_SERVICE}" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=3 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300

  FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" \
    --region "${REGION}" \
    --format="value(status.url)")

  echo ""
  echo "Frontend deployed: ${FRONTEND_URL}"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "=== Deployment Complete ==="
if [ "$DEPLOY_BACKEND" = true ]; then
  echo "Backend:  ${BACKEND_URL}"
  echo "  Health: ${BACKEND_URL}/health"
  echo "  Docs:   ${BACKEND_URL}/docs"
fi
if [ "$DEPLOY_FRONTEND" = true ]; then
  echo "Frontend: ${FRONTEND_URL}"
fi
echo ""
echo "To view logs:"
echo "  gcloud run services logs read ${BACKEND_SERVICE} --region ${REGION}"
echo "  gcloud run services logs read ${FRONTEND_SERVICE} --region ${REGION}"
