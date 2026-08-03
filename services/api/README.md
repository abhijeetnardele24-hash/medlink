# MedLink API service

## Setup

```bash
npm install
cp .env.example .env
```

## Run locally

```bash
npm run dev
```

## Health checks

- `GET /health` returns service liveness.
- `GET /health/ready` validates PostgreSQL connectivity.
