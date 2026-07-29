@echo off
title Mo khoa Windows Firewall cho SinoMedia LAN
echo ============================================================
echo      MO KHOA WINDOWS FIREWALL CHO SINOMEDIA LAN
echo ============================================================
echo.

:: Kiem tra quyen Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ban can phai chay file nay voi quyen Admin!
    echo Hay click chuot phai vao file nay va chon "Run as Administrator".
    echo.
    pause
    exit /b 1
)

echo Dang cau hinh Windows Defender Firewall...
echo.

:: Xoa cac rule cu neu co de tranh trung lap
powershell -Command "Remove-NetFirewallRule -DisplayName 'SinoMedia Dashboard (LAN)' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Remove-NetFirewallRule -DisplayName 'SinoMedia Supabase API (LAN)' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Remove-NetFirewallRule -DisplayName 'SinoMedia Supabase Studio (LAN)' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Remove-NetFirewallRule -DisplayName 'SinoMedia Inbucket (LAN)' -ErrorAction SilentlyContinue" >nul 2>&1

:: Them cac rule moi cho phép truy cap tu LAN
powershell -Command "New-NetFirewallRule -DisplayName 'SinoMedia Dashboard (LAN)' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any" >nul 2>&1
echo [+] Da mo cong 3000 (Dashboard Next.js)

powershell -Command "New-NetFirewallRule -DisplayName 'SinoMedia Supabase API (LAN)' -Direction Inbound -LocalPort 54321 -Protocol TCP -Action Allow -Profile Any" >nul 2>&1
echo [+] Da mo cong 54321 (Supabase API Gateway)

powershell -Command "New-NetFirewallRule -DisplayName 'SinoMedia Supabase Studio (LAN)' -Direction Inbound -LocalPort 54323 -Protocol TCP -Action Allow -Profile Any" >nul 2>&1
echo [+] Da mo cong 54323 (Supabase Studio DB Manager)

powershell -Command "New-NetFirewallRule -DisplayName 'SinoMedia Inbucket (LAN)' -Direction Inbound -LocalPort 54324 -Protocol TCP -Action Allow -Profile Any" >nul 2>&1
echo [+] Da mo cong 54324 (Inbucket Mailbox)

echo.
echo ============================================================
echo THANH CONG! Da mo toan bo cac cong tren Firewall.
echo Bay gio ban hay thu truy cap lai tu dien thoai.
echo ============================================================
pause
