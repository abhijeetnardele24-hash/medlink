@echo off
echo Starting all MedLink services...
start "MedLink API" cmd /k "cd services\api && npm run dev"
start "Patient Web" cmd /k "cd apps\patient-web && npm run dev"
start "Doctor Web" cmd /k "cd apps\doctor-web && npm run dev"
start "Coordinator Web" cmd /k "cd apps\coordinator-web && npm run dev"
start "Landing Web" cmd /k "cd apps\landing-web && npm run dev"
start "Pharmacy Web" cmd /k "cd apps\pharmacy-web && npm run dev"
echo All services started in background windows!
