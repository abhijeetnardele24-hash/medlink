@echo off
echo Staging and committing Forma.ai design system overhaul...
git add apps/*/src/index.css
git commit -m "feat(ui): implement premium Forma.ai design system architecture and CSS tokens across all portals"

echo Staging and committing Landing page interactivity...
git add apps/landing-web/src/App.tsx
git commit -m "feat(landing): integrate framer-motion mega-menus, dynamic hover states, and direct portal routing"

echo Staging and committing Backend Authentication seeding...
git add services/api/create-doctor.ts services/api/create-patient.ts start-all.bat seed-users.bat apps/patient-web/src/lib/firebase.ts apps/doctor-web/.env apps/coordinator-web/.env
git commit -m "chore(auth): provision automated Firebase and Postgres user seeding scripts and sync frontend environment configurations"

echo Staging and committing Sidebar navigation polish...
git commit -am "style(nav): upgrade authenticated sidebar navigation with Manrope typography, tactile padding, and premium active state box-shadows"

echo Pushing to remote repository...
git push

echo.
echo All commits successfully created and pushed!
pause
