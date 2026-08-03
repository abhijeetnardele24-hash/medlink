# Contributing to MedLink

Thank you for contributing to MedLink. This repository is an academic project that aims to demonstrate secure, offline-first telemedicine engineering. Every contribution must protect privacy, preserve traceability and move a clearly defined project outcome forward.

## Working agreement

- Use synthetic/demo data only. Never commit real patient data, recordings, credentials, API keys, private documents or screenshots containing personal information.
- Keep each change scoped to one issue or one independently verifiable outcome.
- Do not claim medical, ABDM, FHIR, security or payment compliance unless it has been formally implemented and verified.
- Preserve the patient/doctor/coordinator permission boundaries defined in the README.

## Daily development workflow

1. Create or select a GitHub issue with a clear acceptance criterion.
2. Create a focused branch using one of: `feat/`, `fix/`, `docs/`, `test/`, `chore/`, `refactor/`.
3. Make small, meaningful commits while the work progresses.
4. Run the relevant checks and document how the change was validated.
5. Open a pull request to `main`, link the issue, complete the checklist and merge only when the change is reviewable.
6. Update README/research documentation whenever architecture, data handling or scope changes.

For solo development, pull requests remain useful: they create a visible design record and make daily work easy to review later.

## Commit convention

Use Conventional Commit-style messages:

```text
<type>(<scope>): <short imperative summary>
```

Allowed types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `build`, `perf`, `security`.

Examples:

```text
feat(api): add health-check endpoint
feat(sync): persist offline appointment requests
fix(auth): block coordinator access to clinical notes
test(sync): cover duplicate appointment retry
docs(architecture): define consent-scoped recording flow
chore(repo): add repository contribution standards
```

For a change with non-obvious design decisions, include this commit body:

```text
Why:
<problem or user outcome>

What:
- <implemented change>
- <implemented change>

Validation:
- <test, manual verification, or review performed>
```

## Pull-request quality

A pull request should contain one coherent feature, fix or documentation improvement. Include the linked issue, summary, test evidence, privacy/security impact and any follow-up work. Keep generated files, dependencies and unrelated formatting changes out of the same pull request.

## When implementation begins

The planned monorepo structure is:

```text
apps/patient-mobile/       Flutter Android application
apps/doctor-web/           React doctor and coordinator dashboard
services/api/              Node.js / TypeScript backend
infra/                     Deployment, Docker and infrastructure definitions
docs/                      Architecture decision records and project documentation
```

Add automated linting, tests and CI checks alongside the first code in each component. A feature is not complete merely because the screen appears; it must enforce authorisation, handle failed/offline states and have evidence of validation where applicable.
