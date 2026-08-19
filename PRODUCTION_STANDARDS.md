# MedLink — Production Standards Charter

This file is a standing operating charter, not a one-time task. It applies to EVERY change,
for the remainder of this project, without exception, until explicitly revoked.

> "From this point onward, treat this project as production-bound. Do not make changes only
> for functionality; continuously review every implementation for security, authorization,
> code quality, test coverage, database/Redis reliability, performance, and observability.
> Flag dead code, duplication, insecure patterns, hardcoded secrets, sensitive logging,
> inefficient queries, missing validation, improper exception handling, and scalability
> issues. For every new feature, add or update appropriate unit/integration tests and
> preserve existing behavior. Do not perform unnecessary refactoring or premature
> optimization. Maintain production-readiness as an ongoing requirement."

Read this file in full before starting any task. If a task conflicts with anything below,
stop and flag the conflict rather than silently picking one over the other.

---

## 1. No task is "done" without real, pasted evidence
- Never report a build, test, or fix as passing without having actually run it and pasted the
  real output in the same message.
- A build passing is not sufficient evidence a feature works — for anything involving auth,
  money, or cross-user data, provide an actual request/response trace or test output proving
  the specific behavior, not just "it compiles."
- If you cannot run something (missing credentials, no live DB, sandbox limitation), say so
  explicitly. Never describe a hypothetical result as if it were observed.
- Local, unpushed changes do not exist as far as any review is concerned. Push before
  reporting anything as complete, and confirm the push (git log / git status) when asked.

## 2. Plan before code — no exceptions, regardless of task size
- Any change touching: authentication/authorization, roles or permissions, money/payments,
  a new database table or schema change, a new external dependency, or a new feature not
  already in REMAINING_WORK.md — requires a written plan and explicit approval BEFORE any
  code is written. This includes changes that feel small.
- Never mark something [DONE] in REMAINING_WORK.md before it has been reviewed and approved.
- Never build a feature (AI integration, reviews system, payout logic, etc.) that was not
  explicitly requested, even if it seems like a natural extension of approved work.

## 3. Security — check this on every change, not just security-labeled tasks
- Authorization must be checked at the point of data access, not inferred from authentication
  alone. "The user is logged in" is never sufficient for "the user may access this specific
  record" — always verify ownership/participation explicitly (the pattern already established
  via requireEncounterParticipant / getAuthorizedEncounterIds).
- Any endpoint returning or mutating a specific record by ID must verify the requesting user
  has a real relationship to that record, not just a valid role.
- Never leave a mutation before an authorization check (verify ownership in the WHERE clause /
  before the write, not after — check, then act, never act then check).
- No hardcoded credentials, emails, or backdoors of any kind, even temporary ones for local
  testing — use environment-gated test flows (matching the existing TEST_BYPASS_AUTH pattern)
  instead, and never let a test-only path activate in production (always assert against
  NODE_ENV=="production" for anything sensitive).
- Never log tokens, passwords, full card/payment details, or full prescription/medical content
  at anything above debug level.
- Any operation involving concurrent access to a shared balance/count (payouts, stock
  quantities, idempotency keys) must be checked for race conditions — use DB-level locking or
  atomic operations, not read-then-check-then-write across separate statements.

## 4. Code quality and dead code
- Flag and remove dead code (unused imports, orphaned files, unreferenced routes) as you find
  it — don't leave it "just in case."
- No duplicated logic across files where one already exists — reuse the established pattern
  (auth middleware, upload handling, validation schemas) rather than reimplementing it.
- Every request body must be validated with a real schema (Zod, matching existing convention)
  — not just a TypeScript type annotation, which provides zero runtime protection.
- Match existing codebase conventions exactly (res.locals.user, not req.user; the established
  error classes; the established route-mounting pattern) rather than introducing a second way
  of doing the same thing.

## 5. Testing
- Every new feature needs a real test proving both the success path AND at least one realistic
  failure path (unauthorized access, invalid input, a duplicate/race condition) — not just the
  happy path.
- Do not write a test that could pass regardless of whether the feature actually works (e.g. a
  test where both the valid and invalid case return the same empty result) — tests must
  actually distinguish correct behavior from broken behavior.
- Preserve existing test coverage — do not remove or weaken an existing test to make a change
  pass.

## 6. Performance and scale — flag, don't necessarily fix
- Flag N+1 queries, missing indexes on frequently-filtered columns, and any endpoint that
  loads unbounded result sets without pagination.
- Do not add caching, a new database, or new infrastructure speculatively — only propose it
  when there's a concrete, current reason (as was done for the Socket.IO Redis adapter, tied
  to a specific real problem, not "might be useful later").

## 7. No unnecessary refactoring
- Do not restructure, rename, or "clean up" code that isn't part of the current task's actual
  scope, even if you notice something that could be improved — note it instead (in
  REMAINING_WORK.md or in your response) and let it be prioritized separately.
- Do not perform premature optimization — correctness and clarity first; only optimize a
  specific, measured bottleneck.

## 8. Observability
- Any new endpoint handling money, auth, or verification decisions should produce a structured
  log line (matching the existing pino logger convention) at the key decision points, not just
  on error.
- Any new background/async process (cron, webhook handler) must log both success and failure
  paths clearly enough to debug from logs alone.

## 9. Communication
- If you find a problem outside the current task's scope while working (a security issue, a
  broken build elsewhere, dead code from a previous session), report it immediately rather than
  fixing it silently or ignoring it — let it be triaged deliberately.
- If you are uncertain whether something meets this charter, say so and ask, rather than
  guessing and presenting the guess as settled.

---

This charter stays in effect for the rest of the project. Confirm you have read it in full
before starting the next task, and reference it explicitly whenever a decision in a future
task involves a tradeoff covered above.