# MedLink API service

## Setup

```bash
npm install
cp .env.example .env
```

Set real DB values in `.env` before running the API.

## Run locally

```bash
npm run dev
```

## Health checks

- `GET /health` returns service liveness.
- `GET /health/ready` validates PostgreSQL connectivity.
