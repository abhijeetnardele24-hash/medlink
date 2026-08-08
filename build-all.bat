@echo off
echo ========================================================
echo MedLink - Local CI Build Gate
echo ========================================================
echo.

echo [1/3] Building Doctor Web...
call npm run build --prefix apps\doctor-web
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Doctor Web build failed.
    exit /b %errorlevel%
)
echo [OK] Doctor Web built successfully.
echo.

echo [2/3] Building Coordinator Web...
call npm run build --prefix apps\coordinator-web
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Coordinator Web build failed.
    exit /b %errorlevel%
)
echo [OK] Coordinator Web built successfully.
echo.

echo [3/3] Type-checking and Building Services API...
call npm run typecheck --prefix services\api
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Services API typecheck failed.
    exit /b %errorlevel%
)
call npm run build --prefix services\api
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Services API build failed.
    exit /b %errorlevel%
)
echo [OK] Services API built successfully.
echo.

echo ========================================================
echo [SUCCESS] All systems compiled successfully!
echo ========================================================
