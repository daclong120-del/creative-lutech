@echo off
setlocal

set "HELP_DIR=%~dp0"
for %%I in ("%HELP_DIR%..") do set "ROOT_DIR=%%~fI"
set "DASHBOARD_DIR=%ROOT_DIR%\dashboard"
set "AUTOTEST_DIR=%ROOT_DIR%\automation-test"
set "BASE_URL=http://127.0.0.1:3000"
set "RUNNER_PORT=3005"
set "RUNNER_URL=http://localhost:%RUNNER_PORT%"

echo.
echo ==========================================
echo  SinoMedia AutoTest - Start Everything
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Khong tim thay npm. Hay cai Node.js truoc.
  pause
  exit /b 1
)

if not exist "%DASHBOARD_DIR%\package.json" (
  echo [ERROR] Khong tim thay dashboard o: "%DASHBOARD_DIR%"
  pause
  exit /b 1
)

if not exist "%DASHBOARD_DIR%\node_modules" (
  echo [ERROR] Dashboard chua co node_modules.
  echo Chay lenh sau roi mo lai file nay:
  echo   cd /d "%DASHBOARD_DIR%"
  echo   npm install
  pause
  exit /b 1
)

if not exist "%AUTOTEST_DIR%\node_modules" (
  echo [ERROR] automation-test chua co node_modules.
  echo Chay lenh sau roi mo lai file nay:
  echo   cd /d "%AUTOTEST_DIR%"
  echo   npm install
  pause
  exit /b 1
)

echo [1/3] Dang khoi dong Dashboard Next.js tai %BASE_URL%
start "SinoMedia Dashboard :3000" cmd /k "cd /d ""%DASHBOARD_DIR%"" && npm run dev -- --hostname 127.0.0.1 --port 3000"

echo [2/3] Dang khoi dong AutoTest Runner tai %RUNNER_URL%
start "SinoMedia AutoTest Runner :%RUNNER_PORT%" cmd /k "cd /d ""%AUTOTEST_DIR%"" && set ""BASE_URL=%BASE_URL%"" && set ""DASHBOARD_PORT=%RUNNER_PORT%"" && npm run dashboard"

echo [3/3] Dang mo trinh duyet...
timeout /t 5 /nobreak >nul
start "" "%RUNNER_URL%"

echo.
echo Da gui lenh khoi dong xong.
echo - Dashboard: %BASE_URL%
echo - AutoTest Runner: %RUNNER_URL%
echo.
echo Giu 2 cua so terminal dang mo de test runner hoat dong.
pause
