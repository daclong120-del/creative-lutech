# Start SinoMedia Crawler Worker

$ErrorActionPreference = 'Continue'
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "          Starting SinoMedia Crawler Worker...               " -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# 1. Kiểm tra entrypoint worker và tsx
$WorkerRoot = Join-Path $PSScriptRoot "..\worker"
$IndexTs = Join-Path $WorkerRoot "src\index.ts"
$TsxCli = Join-Path $WorkerRoot "node_modules\tsx\dist\cli.cjs"

if (!(Test-Path $IndexTs)) {
    Write-Error "CRITICAL: worker/src/index.ts not found! Please build the full package first."
    exit 1
}
if (!(Test-Path $TsxCli)) {
    Write-Error "CRITICAL: tsx entrypoint not found at worker/node_modules/tsx/dist/cli.cjs! Make sure node_modules is fully extracted."
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
    Write-Warning "config/.env not found. Crawler might fail if API_TOKEN is required."
}

# Đảm bảo các biến môi trường bắt buộc cho worker được định nghĩa
if (!$EnvVars.ContainsKey("INTERNAL_API_URL") -and ![System.Environment]::GetEnvironmentVariable("INTERNAL_API_URL")) {
    $EnvVars["INTERNAL_API_URL"] = "http://localhost:3000/api/worker"
}

# 3. Khởi chạy tiến trình background bằng ProcessStartInfo
$PidFile = Join-Path $PSScriptRoot "..\logs\worker.pid"

Write-Host "Starting Crawler Worker (running 'crawl' action)..." -ForegroundColor Green

# Cấu hình khởi chạy trực tiếp node.exe để lấy PID thật của node
$StartInfo = New-Object System.Diagnostics.ProcessStartInfo
$StartInfo.FileName = $NodeExe
$StartInfo.Arguments = "`"$TsxCli`" `"$IndexTs`" crawl"
$StartInfo.WorkingDirectory = $WorkerRoot
$StartInfo.UseShellExecute = $false
$StartInfo.CreateNoWindow = $true

# Không dùng Clear(), không clone toàn bộ env để tránh lỗi duplicate env key của PowerShell.
# Chỉ gán các custom env variables từ config/.env
foreach ($key in $EnvVars.Keys) {
    $StartInfo.EnvironmentVariables[$key] = $EnvVars[$key]
}

$Process = New-Object System.Diagnostics.Process
$Process.StartInfo = $StartInfo

try {
    [void]$Process.Start()
    if ($Process.Id) {
        $Process.Id | Out-File -FilePath $PidFile -Force
        Write-Host "Crawler Worker started successfully with PID: $($Process.Id)" -ForegroundColor Green
    } else {
        Write-Error "Failed to retrieve PID for Worker process!"
        exit 1
    }
} catch {
    Write-Error "Failed to start Worker process: $_"
    exit 1
}
