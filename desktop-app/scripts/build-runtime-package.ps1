param(
    [ValidateSet("Scaffold", "Full")]
    [string]$Mode = "Scaffold",
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'

# Cấu hình đường dẫn
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$DesktopAppRoot = Split-Path -Parent $ScriptDir
$ProjectRoot = Split-Path -Parent $DesktopAppRoot
$ReleaseDir = Join-Path $DesktopAppRoot "release\SinoMedia Desktop"

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "       SinoMedia Desktop Build Package Script ($Mode Mode)   " -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# 1. Thực hiện dọn dẹp nếu có switch -Clean
if ($Clean) {
    Write-Host "[CLEAN] Cleaning release directory..." -ForegroundColor Yellow
    if (Test-Path $ReleaseDir) {
        Remove-Item -Path $ReleaseDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Cleaned: $ReleaseDir" -ForegroundColor Green
    } else {
        Write-Host "Release directory does not exist. Nothing to clean." -ForegroundColor Gray
    }
    
    # Nếu chỉ chạy Clean thì thoát (không build tiếp nếu không muốn)
    # Tuy nhiên thông thường -Clean sẽ đi kèm với build mới. Chúng ta tiếp tục tạo lại thư mục.
}

# 2. Tạo cấu trúc thư mục cơ bản (Scaffold)
Write-Host "[1/4] Creating skeleton directories..."
$Dirs = @("app", "worker", "runtime", "runtime\node", "config", "logs", "data", "scripts")
foreach ($dir in $Dirs) {
    $path = Join-Path $ReleaseDir $dir
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
    }
}
Write-Host "Skeleton directories created at: $ReleaseDir" -ForegroundColor Green

# 3. Copy templates và launcher scripts
Write-Host "[2/4] Copying templates and launcher scripts..."
$EnvTemplate = Join-Path $DesktopAppRoot "templates\env.template"
if (Test-Path $EnvTemplate) {
    Copy-Item -Path $EnvTemplate -Destination (Join-Path $ReleaseDir "config\env.template") -Force
}

$ReadmeTemplate = Join-Path $DesktopAppRoot "templates\README_RELEASE.txt"
if (Test-Path $ReadmeTemplate) {
    Copy-Item -Path $ReadmeTemplate -Destination (Join-Path $ReleaseDir "README_RELEASE.txt") -Force
}

# Copy launcher scripts từ source script dir
$ScriptsToCopy = @("start-dashboard.ps1", "start-worker.ps1", "stop-services.ps1", "health-check.ps1")
foreach ($scriptName in $ScriptsToCopy) {
    $srcPath = Join-Path $ScriptDir $scriptName
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination (Join-Path $ReleaseDir "scripts\") -Force
    }
}
Write-Host "Templates and scripts copied." -ForegroundColor Green

# Khởi tạo các trạng thái mặc định cho manifest
$HasDashboard = $false
$HasWorker = $false
$HasRuntime = $false

# 4. Nếu Mode là "Full", thực hiện trích xuất Dashboard, Worker và Embedded Node
if ($Mode -eq "Full") {
    Write-Host "[3/4] Running Full extraction..." -ForegroundColor Yellow

    # A. Embedded Node Runtime Extraction
    Write-Host "  -> Extracting Embedded Node Runtime..." -ForegroundColor Gray
    $NodeSource = (Get-Command node -ErrorAction SilentlyContinue).Source
    if (!$NodeSource) {
        $CommonPaths = @(
            "C:\Program Files\nodejs\node.exe",
            "C:\Program Files (x86)\nodejs\node.exe",
            "$env:USERPROFILE\AppData\Local\Volta\bin\node.exe"
        )
        foreach ($p in $CommonPaths) {
            if (Test-Path $p) {
                $NodeSource = $p
                break
            }
        }
    }
    
    if ($NodeSource -and (Test-Path $NodeSource)) {
        $NodeDest = Join-Path $ReleaseDir "runtime\node\node.exe"
        Copy-Item -Path $NodeSource -Destination $NodeDest -Force
        Write-Host "     Embedded Node.exe copied from: $NodeSource" -ForegroundColor Green
        $HasRuntime = $true
    } else {
        Write-Warning "Could not find node.exe on host system. Embedded runtime will be marked false."
    }

    # B. Dashboard Extraction (Next.js standalone build & copy)
    Write-Host "  -> Building Dashboard (Next.js Standalone)..." -ForegroundColor Gray
    $DashboardDir = Join-Path $ProjectRoot "dashboard"
    
    # Thực hiện build dashboard
    if (Test-Path $DashboardDir) {
        Push-Location $DashboardDir
        try {
            Write-Host "     Running npm run build in dashboard..."
            npm run build
            Pop-Location
            
            $StandaloneDir = Join-Path $DashboardDir ".next\standalone"
            if (Test-Path $StandaloneDir) {
                Write-Host "     Copying Next.js standalone build using robocopy..."
                $AppDest = Join-Path $ReleaseDir "app"
                
                # Copy standalone server code
                robocopy $StandaloneDir $AppDest /E /R:3 /W:5 /NDL /NFL /NJH /NJS | Out-Null
                
                # Copy static and public assets
                $StaticSrc = Join-Path $DashboardDir ".next\static"
                $StaticDest = Join-Path $AppDest ".next\static"
                $DashboardStaticDest = Join-Path $AppDest "dashboard\.next\static"
                
                if (Test-Path $StaticSrc) {
                    robocopy $StaticSrc $StaticDest /E /R:3 /W:5 /NDL /NFL /NJH /NJS | Out-Null
                    robocopy $StaticSrc $DashboardStaticDest /E /R:3 /W:5 /NDL /NFL /NJH /NJS | Out-Null
                }
                
                $PublicSrc = Join-Path $DashboardDir "public"
                $PublicDest = Join-Path $AppDest "public"
                $DashboardPublicDest = Join-Path $AppDest "dashboard\public"
                if (Test-Path $PublicSrc) {
                    robocopy $PublicSrc $PublicDest /E /R:3 /W:5 /NDL /NFL /NJH /NJS | Out-Null
                    robocopy $PublicSrc $DashboardPublicDest /E /R:3 /W:5 /NDL /NFL /NJH /NJS | Out-Null
                }
                
                Write-Host "     Dashboard standalone extracted successfully." -ForegroundColor Green
                $HasDashboard = $true
            } else {
                Write-Warning "Standalone directory not found at $StandaloneDir. Did next.config.ts output: 'standalone' run?"
            }
        } catch {
            Pop-Location
            Write-Error "Failed to build or extract dashboard: $_"
        }
    } else {
        Write-Error "Dashboard directory not found at $DashboardDir"
    }

    # C. Worker Extraction (crawler-pipeline copy)
    Write-Host "  -> Extracting Crawler Worker..." -ForegroundColor Gray
    $WorkerDir = Join-Path $ProjectRoot "crawler-pipeline"
    $WorkerDest = Join-Path $ReleaseDir "worker"
    
    if (Test-Path $WorkerDir) {
        # Tạo thư mục worker đích
        if (!(Test-Path $WorkerDest)) {
            New-Item -ItemType Directory -Force -Path $WorkerDest | Out-Null
        }
        
        # Copy src
        $SrcFolder = Join-Path $WorkerDir "src"
        if (Test-Path $SrcFolder) {
            robocopy $SrcFolder (Join-Path $WorkerDest "src") /E /R:3 /W:5 /NDL /NFL /NJH /NJS | Out-Null
        }
        
        # Copy package.json
        $PkgJson = Join-Path $WorkerDir "package.json"
        if (Test-Path $PkgJson) {
            Copy-Item -Path $PkgJson -Destination $WorkerDest -Force
        }
        
        # Copy node_modules
        $ModulesFolder = Join-Path $WorkerDir "node_modules"
        if (Test-Path $ModulesFolder) {
            Write-Host "     Copying worker node_modules (this may take a moment)..."
            robocopy $ModulesFolder (Join-Path $WorkerDest "node_modules") /E /R:3 /W:5 /NDL /NFL /NJH /NJS | Out-Null
        }
        
        Write-Host "     Crawler worker extracted successfully." -ForegroundColor Green
        $HasWorker = $true
    } else {
        Write-Error "Crawler pipeline directory not found at $WorkerDir"
    }
    # D. Build Launcher (SinoMedia.exe)
    Write-Host "  -> Compiling SinoMedia Launcher..." -ForegroundColor Gray
    $LauncherSource = Join-Path $DesktopAppRoot "src\Launcher.cs"
    $LauncherDest = Join-Path $ReleaseDir "SinoMedia.exe"
    $CscExe = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
    
    if ((Test-Path $LauncherSource) -and (Test-Path $CscExe)) {
        Write-Host "     Running C# Compiler (csc.exe)..."
        $CscArgs = "/nologo", "/out:$LauncherDest", "/target:exe", "$LauncherSource"
        & $CscExe $CscArgs | Out-Null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $LauncherDest)) {
            Write-Host "     Launcher compiled successfully." -ForegroundColor Green
        } else {
            Write-Error "Failed to compile launcher."
        }
    } else {
        Write-Warning "Launcher source or csc.exe not found. Skipping SinoMedia.exe generation."
    }
} else {
    Write-Host "[3/4] Skipping extraction (Scaffold mode active)." -ForegroundColor Gray
}

# 5. Tạo/Cập nhật manifest.json
Write-Host "[4/4] Generating manifest.json..."
$ManifestPath = Join-Path $ReleaseDir "manifest.json"

# Lấy sourceCommit hiện tại bằng git
$SourceCommit = "unknown"
try {
    # Chạy git từ thư mục gốc dự án
    $SourceCommit = (git -C $ProjectRoot rev-parse HEAD 2>$null).Trim()
} catch {
    # Bỏ qua nếu lỗi
}

$GeneratedAt = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"
$Version = "1.0.0"

# Đọc version từ dashboard package.json nếu có
$DashboardPkg = Join-Path $ProjectRoot "dashboard\package.json"
if (Test-Path $DashboardPkg) {
    try {
        $PkgContent = Get-Content -Raw -Path $DashboardPkg | ConvertFrom-Json
        if ($PkgContent.version) {
            $Version = $PkgContent.version
        }
    } catch {}
}

$ManifestContent = @{
    name = "SinoMedia Desktop Runtime Package"
    status = if ($Mode -eq "Full") { "completed" } else { "scaffold" }
    version = $Version
    buildMode = $Mode
    generatedAt = $GeneratedAt
    sourceCommit = $SourceCommit
    includes = @{
        dashboard = $HasDashboard
        worker = $HasWorker
        embeddedRuntime = $HasRuntime
    }
} | ConvertTo-Json -Depth 4

Set-Content -Path $ManifestPath -Value $ManifestContent
Write-Host "manifest.json updated." -ForegroundColor Green

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Release package process completed." -ForegroundColor Green
Write-Host "Path: $ReleaseDir"
Write-Host "=============================================================" -ForegroundColor Cyan
