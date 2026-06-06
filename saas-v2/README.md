# SiteForge SaaS v2

## Stack
- Backend: FastAPI
- Frontend: React + Vite + Tailwind + TypeScript
- Database: PostgreSQL
- Auth: JWT
- Storage: local media + static + optional S3-compatible object storage
- Deployment: Docker Compose

## Key APIs
- Auth: `/api/v1/auth/*`
- Websites CRUD + duplicate: `/api/v1/websites`
- Pages nested CRUD + duplicate: `/api/v1/pages`
- Media upload/download: `/api/v1/media`
- Templates read: `/api/v1/templates`
- Analytics overview: `/api/v1/analytics/overview`
- Billing placeholder: `/api/v1/billing/*`

## Run
```bash
docker compose up -d
```

## Env
See `backend/.env.example`
Frontend uses `VITE_API_URL`
