@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Khoi dong SinoMedia LAN Stack
echo ============================================================
echo DANG KHOI DONG TOAN BO DICH VU SINOMEDIA (LAN STACK)
echo ============================================================
echo.

set "ROOT=%~dp0.."
set "DASHBOARD_PORT=3000"
set "SUPABASE_PORT=54321"
set "POSTGRES_PORT=54322"
set "STUDIO_PORT=54323"
set "INBUCKET_PORT=54324"

pushd "%ROOT%" >nul

set "LAN_IP="
for /f "tokens=4" %%I in ('route print -4 0.0.0.0 ^| findstr /r "^[ ][ ]*0\.0\.0\.0"') do set "LAN_IP=%%I"

if not defined LAN_IP (
  for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4"') do (
    set "CANDIDATE=%%I"
    set "CANDIDATE=!CANDIDATE: =!"
    echo(!CANDIDATE!| findstr /r "^[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
    if not errorlevel 1 if not defined LAN_IP set "LAN_IP=!CANDIDATE!"
  )
)

if defined LAN_IP (
  for /f "delims=" %%a in ("!LAN_IP!") do set "LAN_IP=%%~a"
  set "LAN_IP=!LAN_IP: =!"
)


if not defined LAN_IP (
  echo [ERROR] Khong tim thay IPv4 LAN cua may nay.
  echo Hay ket noi Wi-Fi/LAN roi chay lai file nay.
  echo.
  popd >nul
  pause
  exit /b 1
)

echo(%LAN_IP%| findstr /r "^[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
if errorlevel 1 (
  echo [ERROR] IPv4 LAN lay duoc khong hop le: "%LAN_IP%"
  echo Hay kiem tra Wi-Fi/LAN roi chay lai file nay.
  echo.
  popd >nul
  pause
  exit /b 1
)

set "LAN_DASHBOARD_URL=http://%LAN_IP%:%DASHBOARD_PORT%"
set "LAN_SUPABASE_URL=http://%LAN_IP%:%SUPABASE_PORT%"
set "LOCAL_SUPABASE_URL=http://127.0.0.1:%SUPABASE_PORT%"
set "LAN_POSTGRES_URL=postgresql://postgres:postgres@%LAN_IP%:%POSTGRES_PORT%/postgres"

echo ======================== COPY NHANH ========================
echo [FRONTEND] Dashboard tren may chu       : http://localhost:%DASHBOARD_PORT%
echo [FRONTEND] Dashboard may khac cung Wi-Fi: %LAN_DASHBOARD_URL%
echo [BACKEND]  Supabase API cho browser LAN : %LAN_SUPABASE_URL%
echo [DATA]     Postgres DB LAN              : %LAN_POSTGRES_URL%
echo [ADMIN]    Supabase Studio              : http://%LAN_IP%:%STUDIO_PORT%
echo [MAIL]     Inbucket                     : http://%LAN_IP%:%INBUCKET_PORT%
echo [WORKER]   Crawler Queue Worker         : KHONG CO PORT HTTP, xem cua so "Crawler Worker - Queue Consumer"
echo ============================================================
echo.
echo Luu y: Neu may khac khong vao duoc, hay Allow Node.js va Docker Desktop trong Windows Firewall.
echo.

if /i "%~1"=="--print-only" (
  echo [INFO] Che do print-only: chi in dia chi, khong khoi dong service.
  popd >nul
  exit /b 0
)

:: 1. Khoi dong Supabase Local (Kiem tra Docker Desktop truoc)
echo [1/3] Dang kiem tra trang thai Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
  echo.
  echo ============================================================
  echo [WARNING] Docker Desktop chua duoc khoi dong hoac chua cai dat!
  echo           Supabase Local yeu cau Docker de hoat dong.
  echo ============================================================
  echo.
  set /p "CONTINUE_CHOICE=Ban co muon tiep tuc bat Next.js va Worker khong? (Y/N): "
  if /i "!CONTINUE_CHOICE!" NEQ "Y" (
    echo Huy khoi dong SinoMedia LAN Stack.
    popd >nul
    pause
    exit /b 1
  )
) else (
  echo [1/3] Dang khoi dong Supabase Local Database...
  start "Supabase Database - API %SUPABASE_PORT%" cmd /k "title Supabase Database - API %SUPABASE_PORT% && cd /d ""%ROOT%"" && echo [SUPABASE] API: %LAN_SUPABASE_URL% && echo [SUPABASE] DB : %LAN_POSTGRES_URL% && npx.cmd supabase start"
  echo Dang cho Supabase gateway san sang...
  timeout /t 8 /nobreak >nul
  powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %SUPABASE_PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
  if errorlevel 1 (
    echo.
    echo [WARN] Supabase API port %SUPABASE_PORT% chua mo.
    echo [WARN] Neu dashboard khong goi duoc backend, hay chay:
    echo        npx.cmd supabase stop
    echo        npx.cmd supabase start
    echo [WARN] Sau do chay lai file BAT nay.
    echo.
  )
)

:: 2. Khoi dong Crawler Worker
echo [2/3] Dang khoi dong Crawler Queue Worker...
start "Crawler Worker - Queue Consumer" cmd /k "title Crawler Worker - Queue Consumer ^(NO HTTP PORT^) && cd /d ""%ROOT%\crawler-pipeline"" && echo [WORKER] Khong co port HTTP. Day la queue consumer ket noi qua Token Guard ^(Next.js API^). && echo [WORKER] Lenh: npm.cmd run worker:dev && npm.cmd run worker:dev || echo [WORKER ERROR] Worker da dung. Doc loi phia tren cua cua so nay."

:: 3. Khoi dong Next.js Dashboard (LAN)
echo [3/3] Dang khoi dong Dashboard Next.js (0.0.0.0:%DASHBOARD_PORT%)...
start "SinoMedia Dashboard LAN - Port %DASHBOARD_PORT%" cmd /k "title SinoMedia Dashboard LAN - Port %DASHBOARD_PORT% && cd /d ""%ROOT%\dashboard"" && echo [DASHBOARD] Local: http://localhost:%DASHBOARD_PORT% && echo [DASHBOARD] LAN  : %LAN_DASHBOARD_URL% && echo [DASHBOARD] NEXT_PUBLIC_SUPABASE_URL=%LAN_SUPABASE_URL% && set HOSTNAME=0.0.0.0&& set PORT=%DASHBOARD_PORT%&& set NEXT_PUBLIC_SITE_URL=%LAN_DASHBOARD_URL%&& set NEXT_PUBLIC_SUPABASE_URL=%LAN_SUPABASE_URL%&& npm.cmd run dev -- --hostname 0.0.0.0 --port %DASHBOARD_PORT%"

echo.
echo ============================================================
echo HOAN TAT! Cac cua so dich vu da duoc khoi chay song song.
echo.
echo COPY DE MO DASHBOARD:
echo   May chu              : http://localhost:%DASHBOARD_PORT%
echo   May khac cung Wi-Fi  : %LAN_DASHBOARD_URL%
echo.
echo WORKER KHONG CO PORT. Neu worker chay dung, cua so "Crawler Worker - Queue Consumer"
echo se hien dong "Dang lang nghe task tu Supabase" hoac log poll task.
echo ============================================================
popd >nul
pause
