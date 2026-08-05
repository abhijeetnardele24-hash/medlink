# MedLink Day 2 — Robust commit & push script
# Run from PowerShell in the project root:
#   cd "c:\Users\Abhijeet Nardele\OneDrive\Desktop\Edi project sem 5"
#   .\day2-push.ps1

$ErrorActionPreference = "Continue"  # don't stop on non-fatal errors
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "`n=== MedLink Day 2 Push Script ===" -ForegroundColor Yellow
Write-Host "Working directory: $root`n"

# Helper: commit a set of files with a message, then push
function Commit-And-Push {
    param(
        [string]$Label,
        [string[]]$Files,
        [string]$Message
    )
    Write-Host "--- $Label ---" -ForegroundColor Cyan

    # Stage the files
    foreach ($f in $Files) {
        if (Test-Path $f) {
            git add $f
            Write-Host "  staged: $f" -ForegroundColor DarkGray
        } else {
            Write-Host "  SKIP (not found): $f" -ForegroundColor DarkYellow
        }
    }

    # Check if there's anything staged
    $staged = git diff --cached --name-only
    if (-not $staged) {
        Write-Host "  Nothing new to commit for: $Message" -ForegroundColor DarkYellow
        return
    }

    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  COMMIT FAILED for: $Message" -ForegroundColor Red
        return
    }

    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  PUSH FAILED — check your internet / auth" -ForegroundColor Red
        exit 1
    }

    Write-Host "  Pushed: $Message" -ForegroundColor Green
    Write-Host ""
}

# ── Step 0: npm install ───────────────────────────────────────────────────────
Write-Host "[0] Installing npm packages..." -ForegroundColor Cyan
Set-Location "$root\services\api"
npm install --silent
Set-Location $root
Write-Host "npm install done.`n" -ForegroundColor Green

# ── COMMIT 1: deps ────────────────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 1 — dependencies" `
    @("services/api/package.json", "services/api/package-lock.json", "services/api/drizzle.config.ts") `
    "chore(api): add drizzle-orm, firebase-admin, zod, pino, cors, helmet"

# ── COMMIT 2: db schema ───────────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 2 — drizzle db schema" `
    @("services/api/src/db/schema.ts", "services/api/src/db/index.ts") `
    "feat(api): add drizzle orm schema for all domain entities"

# ── COMMIT 3: auth middleware ─────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 3 — firebase auth middleware" `
    @("services/api/src/firebase.ts",
      "services/api/src/middleware/auth.ts",
      "services/api/src/middleware/requireRole.ts",
      "services/api/src/middleware/validateBody.ts") `
    "feat(api): add firebase auth middleware and role guard"

# ── COMMIT 4: zod schemas ─────────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 4 — zod validation schemas" `
    @("services/api/src/schemas/auth.schema.ts",
      "services/api/src/schemas/doctor.schema.ts",
      "services/api/src/schemas/appointment.schema.ts") `
    "feat(api): add zod request validation schemas"

# ── COMMIT 5: errors + logger ─────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 5 — errors and logger" `
    @("services/api/src/errors.ts", "services/api/src/logger.ts") `
    "feat(api): add typed AppError classes and pino structured logger"

# ── COMMIT 6: auth routes ─────────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 6 — auth routes" `
    @("services/api/src/routes/auth.routes.ts",
      "services/api/src/routes/health.routes.ts") `
    "feat(api): implement /auth/register and /auth/me endpoints"

# ── COMMIT 7: doctor routes ───────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 7 — doctor routes" `
    @("services/api/src/routes/doctors.routes.ts") `
    "feat(api): implement doctor directory and availability routes"

# ── COMMIT 8: appointment routes ──────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 8 — appointment routes" `
    @("services/api/src/routes/appointments.routes.ts") `
    "feat(api): implement appointment CRUD with optimistic locking"

# ── COMMIT 9: server + fixes ──────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 9 — server wired + bug fixes" `
    @("services/api/src/server.ts",
      "services/api/src/index.ts",
      "services/api/src/postgres.ts",
      "services/api/.env.example") `
    "feat(api): wire cors, helmet, rate-limit, routes and global error handler"

# ── COMMIT 10: infra ──────────────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 10 — infra updates" `
    @("infra/docker-compose.yml", "infra/.env.example") `
    "feat(infra): add migrate service to docker-compose, update env vars"

# ── COMMIT 11: docs ───────────────────────────────────────────────────────────
Commit-And-Push `
    "COMMIT 11 — adr docs" `
    @("docs/decisions/ADR-002-drizzle-orm.md") `
    "docs: add ADR-002 for drizzle orm over prisma decision"

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "`n=== All done! ===" -ForegroundColor Yellow
Write-Host "View commits at: https://github.com/abhijeetnardele24-hash/medlink/commits/main" -ForegroundColor Cyan
git log --oneline -15
