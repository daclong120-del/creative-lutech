@echo off
setlocal EnableExtensions EnableDelayedExpansion
title SinoMedia All-in-One Restarter
echo ============================================================
echo      DANG KHOI DONG LAI TOAN BO DI CH VU SINOMEDIA
echo ============================================================
echo.

set "ROOT=%~dp0.."
set "DASHBOARD_PORT=3000"
set "SUPABASE_PORT=54321"
set "POSTGRES_PORT=54322"
set "STUDIO_PORT=54323"
set "INBUCKET_PORT=54324"
set "AUTOTEST_PORT=3005"

pushd "%ROOT%" >nul

:: 1. Don dep va giai phong port truoc khi chay
echo [1/5] Dang don dep cac cua so cu va giai phong cong 3000, 3005...
taskkill /F /FI "WINDOWTITLE eq SinoMedia*" /T >nul 2>&1

for /f "tokens=5" %%a in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":3000 :3005"') do (
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: 2. Lay IP LAN cua may
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
  echo [WARNING] Khong tim thay IP LAN. Mac dinh dung localhost.
  set "LAN_IP=127.0.0.1"
)

set "LAN_DASHBOARD_URL=http://%LAN_IP%:%DASHBOARD_PORT%"
set "LAN_SUPABASE_URL=http://%LAN_IP%:%SUPABASE_PORT%"

echo.
echo IP LAN phat hien: %LAN_IP%
echo.

:: 3. Kiem tra Docker va start Supabase
echo [2/5] Kiem tra Docker Desktop va start Supabase...
docker ps >nul 2>&1
if not errorlevel 1 goto START_SUPABASE_DOCKER

echo.
echo ============================================================
echo [WARNING] Docker Desktop chua duoc khoi dong hoac chua cai dat!
echo           Supabase Local yeu cau Docker de hoat dong.
echo ============================================================
echo.
set /p "CONTINUE_CHOICE=Ban co muon tiep tuc bat Next.js va Worker khong? [Y/N]: "
if /i "!CONTINUE_CHOICE!"=="Y" goto START_NEXT_AND_WORKER
echo Huy khoi dong.
popd >nul
exit /b 1

:START_SUPABASE_DOCKER
start "SinoMedia Supabase Database" cmd /k "title SinoMedia Supabase Database && cd /d "%ROOT%" && npx supabase start"
echo Dang cho Supabase gateway san sang trong 8 giay...
timeout /t 8 /nobreak >nul

:START_NEXT_AND_WORKER

:: 4. Bat Crawler Worker
echo [3/5] Dang bat Crawler Queue Worker...
start "SinoMedia Crawler Worker" cmd /k "title SinoMedia Crawler Worker ^(NO HTTP PORT^) && cd /d "%ROOT%\crawler-pipeline" && echo [WORKER] Dang lang nghe task tu queue... && npm run worker:dev"

:: 5. Bat Dashboard (Cho phep ca Local lan LAN truy cap)
echo [4/5] Dang bat LutechTools Dashboard (Ho tro ca Local va LAN)...
start "SinoMedia Dashboard - Active" cmd /k "title SinoMedia Dashboard - Active && cd /d "%ROOT%\dashboard" && echo [DASHBOARD] Local: http://localhost:%DASHBOARD_PORT% && echo [DASHBOARD] LAN  : %LAN_DASHBOARD_URL% && set HOSTNAME=0.0.0.0&& set PORT=%DASHBOARD_PORT%&& set NEXT_PUBLIC_SITE_URL=%LAN_DASHBOARD_URL%&& set NEXT_PUBLIC_SUPABASE_URL=%LAN_SUPABASE_URL%&& npm run dev -- --hostname 0.0.0.0 --port %DASHBOARD_PORT%"

:: 6. Bat AutoTest Dashboard
echo [5/5] Dang bat AutoTest Dashboard...
start "SinoMedia AutoTest Dashboard" cmd /k "title SinoMedia AutoTest Dashboard && cd /d "%ROOT%\automation-test" && echo [AUTOTEST] Chay tren: http://localhost:%AUTOTEST_PORT% && node runner/server.js"

echo.
echo ============================================================
echo KHOI DONG LAI THANH CONG!
echo.
echo [FRONTEND] Dashboard: http://localhost:%DASHBOARD_PORT% hoac %LAN_DASHBOARD_URL%
echo [AUTOTEST] Dashboard: http://localhost:%AUTOTEST_PORT%
echo ============================================================
echo.
popd >nul
pause
