# Stop SinoMedia Desktop Services

$ErrorActionPreference = 'Continue'
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "          Stopping SinoMedia Desktop Services...             " -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# 1. Dừng Dashboard Server dựa trên PID
$DashPidFile = Join-Path $PSScriptRoot "..\logs\dashboard.pid"
if (Test-Path $DashPidFile) {
    try {
        $pidVal = (Get-Content $DashPidFile -Raw) -replace '[^\d]'
        if ($pidVal) {
            $pidInt = [int]$pidVal
            Write-Host "Stopping Dashboard Server (PID: $pidInt)..." -ForegroundColor Yellow
            Stop-Process -Id $pidInt -Force -ErrorAction SilentlyContinue
            Write-Host "Dashboard Server stopped." -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not stop Dashboard process: $_"
    }
    Remove-Item $DashPidFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No dashboard.pid file found." -ForegroundColor Gray
}

# 2. Dừng Crawler Worker dựa trên PID
$WorkerPidFile = Join-Path $PSScriptRoot "..\logs\worker.pid"
if (Test-Path $WorkerPidFile) {
    try {
        $pidVal = (Get-Content $WorkerPidFile -Raw) -replace '[^\d]'
        if ($pidVal) {
            $pidInt = [int]$pidVal
            Write-Host "Stopping Crawler Worker (PID: $pidInt)..." -ForegroundColor Yellow
            Stop-Process -Id $pidInt -Force -ErrorAction SilentlyContinue
            Write-Host "Crawler Worker stopped." -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not stop Worker process: $_"
    }
    Remove-Item $WorkerPidFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No worker.pid file found." -ForegroundColor Gray
}

# 3. Fallback: Dừng tất cả tiến trình node.exe khởi chạy từ thư mục runtime
$NodeExe = Join-Path $PSScriptRoot "..\runtime\node\node.exe"
if (Test-Path $NodeExe) {
    Write-Host "Performing clean up scan for leftover processes..." -ForegroundColor Gray
    try {
        $NodeProcesses = Get-Process node -ErrorAction SilentlyContinue
        foreach ($proc in $NodeProcesses) {
            try {
                if ($proc.Path -eq $NodeExe) {
                    Write-Host "Killing leftover embedded node process (PID: $($proc.Id))..." -ForegroundColor Yellow
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Quyền đọc Path có thể bị hạn chế cho một số tiến trình hệ thống, bỏ qua
            }
        }
    } catch {
        Write-Warning "Clean up scan encountered an error: $_"
    }
}

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] All services stopped." -ForegroundColor Green
