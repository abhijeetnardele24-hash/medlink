# Infrastructure

This folder contains local infrastructure setup for MedLink services.

## Local API + PostgreSQL stack

Run from `infra/docker-compose.yml`:

```bash
cp infra/.env.example infra/.env
docker compose -f infra/docker-compose.yml up --build
```

Services:

- PostgreSQL: `localhost:5432`
- MedLink API: `localhost:3000`

Health endpoints:

- `GET /health`
- `GET /health/ready`
