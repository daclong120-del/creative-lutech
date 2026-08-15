# Start SinoMedia Dashboard Server

$ErrorActionPreference = 'Continue'
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "          Starting SinoMedia Dashboard Server...             " -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# 1. Kiểm tra standalone server.js
$ServerJs = Join-Path $PSScriptRoot "..\app\server.js"
if (!(Test-Path $ServerJs)) {
    Write-Error "CRITICAL: app/server.js not found! Please build the full package first."
    exit 1
}

$NodeExe = Join-Path $PSScriptRoot "..\runtime\node\node.exe"
if (!(Test-Path $NodeExe)) {
    Write-Error "CRITICAL: Embedded Node runtime not found at $NodeExe!"
    exit 1
}

# 2. Đọc file .env cấu hình
$EnvVars = @{}
$EnvFile = Join-Path $PSScriptRoot "..\config\.env"
if (Test-Path $EnvFile) {
    Write-Host "Loading environment variables from config/.env..." -ForegroundColor Gray
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $index = $line.IndexOf("=")
            $name = $line.Substring(0, $index).Trim()
            $value = $line.Substring($index + 1).Trim()
            # Bỏ dấu nháy nếu có
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $EnvVars[$name] = $value
        }
    }
} else {
    Write-Warning "config/.env not found. Using default environment settings."
}

# Đặt mặc định PORT là 3000 nếu chưa được thiết lập
if (!$EnvVars.ContainsKey("PORT") -and ![System.Environment]::GetEnvironmentVariable("PORT")) {
    $EnvVars["PORT"] = "3000"
}
$Port = if ($EnvVars.ContainsKey("PORT")) { $EnvVars["PORT"] } else { [System.Environment]::GetEnvironmentVariable("PORT") }

# 3. Khởi chạy tiến trình background bằng ProcessStartInfo
$PidFile = Join-Path $PSScriptRoot "..\logs\dashboard.pid"

Write-Host "Starting Dashboard on port $Port..." -ForegroundColor Green

# Cấu hình khởi chạy trực tiếp node.exe để lấy PID thật của node
$StartInfo = New-Object System.Diagnostics.ProcessStartInfo
$StartInfo.FileName = $NodeExe
$StartInfo.Arguments = "`"$ServerJs`""
$StartInfo.WorkingDirectory = Join-Path $PSScriptRoot "..\app"
$StartInfo.UseShellExecute = $false
$StartInfo.CreateNoWindow = $true

# Không dùng Clear(), không clone toàn bộ env để tránh lỗi duplicate env key của PowerShell.
# Chỉ gán các custom env variables từ config/.env
foreach ($key in $EnvVars.Keys) {
    $StartInfo.EnvironmentVariables[$key] = $EnvVars[$key]
}

# Đảm bảo PORT được gán
if (!$StartInfo.EnvironmentVariables.ContainsKey("PORT")) {
    $StartInfo.EnvironmentVariables["PORT"] = $Port
}

$Process = New-Object System.Diagnostics.Process
$Process.StartInfo = $StartInfo

try {
    [void]$Process.Start()
    if ($Process.Id) {
        $Process.Id | Out-File -FilePath $PidFile -Force
        Write-Host "Dashboard Server started successfully with PID: $($Process.Id)" -ForegroundColor Green
    } else {
        Write-Error "Failed to retrieve PID for Dashboard process!"
        exit 1
    }
} catch {
    Write-Error "Failed to start Dashboard process: $_"
    exit 1
}
