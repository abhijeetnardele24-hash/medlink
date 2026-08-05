# ADR-002: Use Drizzle ORM for database access

**Date:** 2026-08-05  
**Status:** Accepted  
**Deciders:** Abhijeet Nardele (project lead)

---

## Context

MedLink's backend needs a way to talk to PostgreSQL that satisfies three requirements:
1. **Type safety** — TypeScript types must match the actual DB schema with no runtime surprises.
2. **Migrations** — schema changes must be tracked, reviewable, and repeatable across environments.
3. **Transparency** — it must be obvious what SQL is running. Hidden magic in an ORM makes debugging production issues harder.

The main candidates were: **Drizzle ORM**, **Prisma**, and **raw SQL with `pg`**.

---

## Decision

We will use **Drizzle ORM** with `drizzle-kit` for migrations.

---

## Reasons

| Criterion | Drizzle | Prisma | Raw pg |
|---|---|---|---|
| TypeScript types from schema | ✅ (schema = types) | ✅ (generated) | ❌ (manual) |
| SQL transparency | ✅ (query builder maps 1:1 to SQL) | ⚠️ (hides joins, N+1 risk) | ✅ |
| Migration workflow | ✅ (`drizzle-kit generate` / `push`) | ✅ (`prisma migrate dev`) | ❌ (manual files) |
| Bundle size | ✅ Very small | ⚠️ Large binary (Rust query engine) | ✅ |
| No separate process | ✅ | ❌ (requires prisma generate step) | ✅ |
| Custom constraint support | ✅ (CHECK, partial indexes) | ⚠️ (limited) | ✅ |

Drizzle's schema-as-code approach means the same file that defines the DB structure also provides all TypeScript types. There is no code-generation step between editing the schema and seeing types update. This keeps the development loop fast.

Prisma was ruled out primarily because of its Rust-based query engine (added Docker image size and `prisma generate` CI step) and its tendency to hide complex joins in a way that makes audit queries harder to reason about.

Raw `pg` was ruled out because hand-written types for 18+ tables would be error-prone and expensive to maintain.

---

## Consequences

- Schema lives in `services/api/src/db/schema.ts`. Every table, column, index, and enum is defined there.
- `drizzle-kit generate` creates SQL migration files in `src/db/migrations/`.
- The `infra/docker-compose.yml` `migrate` service runs `drizzle-kit push` (direct schema sync, suitable for development). Production will use `drizzle-kit migrate` with generated migration files.
- All queries use the Drizzle query builder. Raw SQL (`sql` template tag) is used only for the health check `SELECT 1`.
