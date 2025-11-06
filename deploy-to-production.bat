@echo off
echo ====================================
echo Chronicle Vaults - Production Deploy
echo ====================================
echo.

REM Build frontend
echo [1/5] Building frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo Frontend build complete!
echo.

REM Upload frontend dist files
echo [2/5] Uploading frontend to VPS...
scp -r "dist\*" root@72.60.202.163:/var/www/chroniclevaults/frontend/
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend upload failed!
    pause
    exit /b 1
)
echo Frontend uploaded successfully!
echo.

REM Upload backend files (excluding node_modules)
echo [3/5] Uploading backend to VPS...
scp -r "backend\*" root@72.60.202.163:/var/www/chroniclevaults/backend/
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend upload failed!
    pause
    exit /b 1
)
echo Backend uploaded successfully!
echo.

REM Restart PM2 on server
echo [4/5] Restarting backend server...
ssh root@72.60.202.163 "pm2 restart chroniclevaults-backend --update-env"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PM2 restart failed!
    pause
    exit /b 1
)
echo Backend restarted successfully!
echo.

REM Test deployment
echo [5/5] Testing deployment...
echo Testing API endpoint...
curl -s https://chroniclevaults.com/api/products | findstr "success"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: API test failed - please check manually
) else (
    echo API test successful!
)
echo.

echo ====================================
echo DEPLOYMENT COMPLETE!
echo ====================================
echo Website: https://chroniclevaults.com/
echo API: https://chroniclevaults.com/api/
echo.
echo Please verify the site is working properly.
pause
