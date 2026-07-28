@echo off
title SinoMedia Stopper
echo ==========================================
echo       SinoMedia All-in-One Stopper        
echo ==========================================
echo.

:: 1. Stop Next.js Frontend
echo [1/3] Stopping Next.js Frontend...
taskkill /F /FI "WINDOWTITLE eq SinoMedia Frontend*" /T >nul 2>&1
echo Frontend stopped.
echo.

:: 2. Stop Crawler Pipeline
echo [2/3] Stopping Crawler Pipeline...
taskkill /F /FI "WINDOWTITLE eq SinoMedia Crawler Worker*" /T >nul 2>&1
echo Crawler worker stopped.
echo.

:: 3. Stop Supabase
echo [3/3] Stopping Supabase backend...
call npx supabase stop
echo.

echo ==========================================
echo All services have been stopped!
echo ==========================================
pause
