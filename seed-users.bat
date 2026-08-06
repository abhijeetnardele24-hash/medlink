@echo off
echo Provisioning test users into Firebase and Database...
cd services\api
call npx tsx create-doctor.ts
call npx tsx create-patient.ts
echo.
echo Setup Complete! You can now log in.
pause
