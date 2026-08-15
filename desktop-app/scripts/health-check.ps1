param(
    [switch]$Smoke
)

# SinoMedia Desktop Health Check & Smoke Test Script
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ($ScriptDir.EndsWith("scripts")) {
    $ReleaseDir = Split-Path -Parent $ScriptDir
} else {
    $ReleaseDir = Split-Path -Parent $ScriptDir
}

# Nếu chạy từ desktop-app/scripts thì trỏ sang release/SinoMedia Desktop
if (Test-Path (Join-Path $ReleaseDir "release\SinoMedia Desktop")) {
    $ReleaseDir = Join-Path $ReleaseDir "release\SinoMedia Desktop"
}

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "             Running SinoMedia Desktop Health Check          " -ForegroundColor Cyan
Write-Host "             Release Path: $ReleaseDir" -ForegroundColor Gray
Write-Host "             Smoke Mode: $(if ($Smoke) { 'Enabled' } else { 'Disabled' })" -ForegroundColor Gray
Write-Host "=============================================================" -ForegroundColor Cyan

$Success = $true
$Manifest = $null

# 1. Kiểm tra manifest.json
$ManifestPath = Join-Path $ReleaseDir "manifest.json"
if (!(Test-Path $ManifestPath)) {
    Write-Error "CRITICAL: manifest.json is missing!"
    $Success = $false
} else {
    try {
        $Manifest = Get-Content -Raw -Path $ManifestPath | ConvertFrom-Json
        Write-Host "[OK] manifest.json exists and is valid JSON." -ForegroundColor Green
        Write-Host "     Version: $($Manifest.version)" -ForegroundColor Gray
        Write-Host "     Build Mode: $($Manifest.buildMode)" -ForegroundColor Gray
        Write-Host "     Generated At: $($Manifest.generatedAt)" -ForegroundColor Gray
        Write-Host "     Source Commit: $($Manifest.sourceCommit)" -ForegroundColor Gray
    } catch {
        Write-Error "CRITICAL: Failed to parse manifest.json: $_"
        $Success = $false
    }
}

# 2. Kiểm tra config/env.template
$EnvTemplatePath = Join-Path $ReleaseDir "config\env.template"
if (!(Test-Path $EnvTemplatePath)) {
    Write-Error "CRITICAL: config/env.template is missing!"
    $Success = $false
} else {
    Write-Host "[OK] config/env.template exists." -ForegroundColor Green
}

# 3. Kiểm tra các thư mục app/, worker/, runtime/, logs/, data/
$DirsToCheck = @("app", "worker", "runtime", "logs", "data")
foreach ($dir in $DirsToCheck) {
    $dirPath = Join-Path $ReleaseDir $dir
    if (!(Test-Path $dirPath)) {
        Write-Error "CRITICAL: Required directory '$dir' is missing!"
        $Success = $false
    } else {
        Write-Host "[OK] Directory '$dir' exists." -ForegroundColor Green
    }
}

# 4. Kiểm tra rò rỉ SUPABASE_SERVICE_ROLE_KEY trong config/
$ConfigDir = Join-Path $ReleaseDir "config"
$ServiceRoleFound = $false
if (Test-Path $ConfigDir) {
    $Files = Get-ChildItem -Path $ConfigDir -File -Recurse
    foreach ($file in $Files) {
        $content = Get-Content -Raw -Path $file.FullName
        if ($content -match "SUPABASE_SERVICE_ROLE_KEY") {
            Write-Error "CRITICAL: SUPABASE_SERVICE_ROLE_KEY was found in config file '$($file.Name)'!"
            $ServiceRoleFound = $true
        }
    }
}
if ($ServiceRoleFound) {
    $Success = $false
} else {
    Write-Host "[OK] No SUPABASE_SERVICE_ROLE_KEY leakage detected in config/ directory." -ForegroundColor Green
}

# 5. Kiểm tra tính hợp lệ của dashboard/worker/runtime theo manifest.json
if ($Success -and $Manifest) {
    $Includes = $Manifest.includes
    if ($Includes) {
        # Dashboard check
        if ($Includes.dashboard -eq $true) {
            $ServerJs = Join-Path $ReleaseDir "app\server.js"
            if (!(Test-Path $ServerJs)) {
                Write-Error "CRITICAL: Dashboard is marked true in manifest but app/server.js is missing!"
                $Success = $false
            } else {
                Write-Host "[OK] Dashboard component verified (app/server.js exists)." -ForegroundColor Green
            }
        } else {
            Write-Host "[PLANNED] Dashboard component is planned (marked false in manifest)." -ForegroundColor Yellow
        }

        # Worker check
        if ($Includes.worker -eq $true) {
            $WorkerPkg = Join-Path $ReleaseDir "worker\package.json"
            if (!(Test-Path $WorkerPkg)) {
                Write-Error "CRITICAL: Worker is marked true in manifest but worker/package.json is missing!"
                $Success = $false
            } else {
                Write-Host "[OK] Worker component verified (worker/package.json exists)." -ForegroundColor Green
            }
        } else {
            Write-Host "[PLANNED] Worker component is planned (marked false in manifest)." -ForegroundColor Yellow
        }

        # Embedded Runtime check
        if ($Includes.embeddedRuntime -eq $true) {
            $NodeExe = Join-Path $ReleaseDir "runtime\node\node.exe"
            if (!(Test-Path $NodeExe)) {
                Write-Error "CRITICAL: Embedded Runtime is marked true in manifest but runtime/node/node.exe is missing!"
                $Success = $false
            } else {
                Write-Host "[OK] Embedded Node runtime verified (runtime/node/node.exe exists)." -ForegroundColor Green
            }
        } else {
            Write-Host "[PLANNED] Embedded Node runtime is planned (marked false in manifest)." -ForegroundColor Yellow
        }
    } else {
        Write-Warning "No 'includes' metadata section found in manifest.json."
    }
}

# 6. Chạy Smoke Test (nếu được kích hoạt và kiểm tra cơ bản pass)
if ($Smoke) {
    if (!$Success) {
        Write-Error "Smoke test aborted because basic health check failed."
    } elseif (!$Manifest -or !$Manifest.includes -or $Manifest.buildMode -eq "Scaffold") {
        Write-Warning "Smoke test skipped: buildMode is Scaffold or includes metadata is missing."
    } else {
        Write-Host "`n--- Running Smoke Test ---" -ForegroundColor Cyan
        $SmokeSuccess = $true
        
        # Launcher paths
        $StartDashScript = Join-Path $ReleaseDir "scripts\start-dashboard.ps1"
        $StartWorkerScript = Join-Path $ReleaseDir "scripts\start-worker.ps1"
        $StopScript = Join-Path $ReleaseDir "scripts\stop-services.ps1"
        
        $DashPidFile = Join-Path $ReleaseDir "logs\dashboard.pid"
        $WorkerPidFile = Join-Path $ReleaseDir "logs\worker.pid"
        
        # Xóa các file PID cũ trước khi test
        Remove-Item $DashPidFile -ErrorAction SilentlyContinue | Out-Null
        Remove-Item $WorkerPidFile -ErrorAction SilentlyContinue | Out-Null
        
        # Đọc API_TOKEN từ file config/.env
        $ApiToken = $null
        $EnvFile = Join-Path $ReleaseDir "config\.env"
        if (Test-Path $EnvFile) {
            $EnvContent = Get-Content $EnvFile
            foreach ($line in $EnvContent) {
                $trimmed = $line.Trim()
                if ($trimmed.StartsWith("API_TOKEN")) {
                    $parts = $trimmed.Split("=")
                    if ($parts.Length -gt 1) {
                        $ApiToken = $parts[1].Trim()
                        if ($ApiToken.StartsWith('"') -and $ApiToken.EndsWith('"')) {
                            $ApiToken = $ApiToken.Substring(1, $ApiToken.Length - 2)
                        }
                    }
                }
            }
        }
        
        if (!(Test-Path $StartDashScript) -or !(Test-Path $StartWorkerScript) -or !(Test-Path $StopScript)) {
            Write-Error "CRITICAL: Launcher scripts (start/stop) are missing from release scripts folder!"
            $SmokeSuccess = $false
            $Success = $false
        } else {
            # Bước A: Khởi động Dashboard
            Write-Host "[Smoke] Launching Dashboard server..." -ForegroundColor Gray
            & $StartDashScript
            
            # 1. Chờ dashboard.pid được sinh ra
            Write-Host "[Smoke] Waiting for dashboard.pid to be generated..." -ForegroundColor Gray
            $PidOk = $false
            $Checks = 0
            $dPidVal = $null
            while ($Checks -lt 5 -and !$PidOk) {
                Start-Sleep -Seconds 1
                $Checks++
                if (Test-Path $DashPidFile) {
                    $dPidVal = (Get-Content $DashPidFile -Raw) -replace '[^\d]'
                    if ($dPidVal) {
                        $PidOk = $true
                    }
                }
            }
            
            if (!$PidOk) {
                Write-Error "[Smoke FAILED] dashboard.pid was not generated by launcher!"
                $SmokeSuccess = $false
            } else {
                $dPidInt = [int]$dPidVal
                $dProc = Get-Process -Id $dPidInt -ErrorAction SilentlyContinue
                if ($dProc -and !$dProc.HasExited) {
                    Write-Host "[Smoke OK] Dashboard process is running under PID: $dPidInt. Verifying HTTP port..." -ForegroundColor Green
                    
                    # 2. Kiểm tra port 3000
                    $PortOk = $false
                    $Checks = 0
                    $MaxChecks = 6
                    $DashboardUri = "http://localhost:3000/login"
                    
                    while ($Checks -lt $MaxChecks -and !$PortOk) {
                        Start-Sleep -Seconds 2
                        $Checks++
                        try {
                            $Response = Invoke-WebRequest -Uri $DashboardUri -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
                            if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
                                $PortOk = $true
                            }
                        } catch {
                            if ($_.Exception.Message -match "Unable to connect" -or $_.Exception.InnerException.Message -match "connection refused") {
                                Write-Host "        Attempt $Checks/${MaxChecks}: Waiting for Dashboard port 3000 to listen..." -ForegroundColor Yellow
                            } else {
                                $PortOk = $true
                            }
                        }
                    }
                    
                    if ($PortOk) {
                        Write-Host "[Smoke OK] Dashboard responds successfully at $DashboardUri" -ForegroundColor Green
                    } else {
                        Write-Error "[Smoke FAILED] Dashboard port 3000 failed to respond after $($MaxChecks * 2) seconds."
                        $SmokeSuccess = $false
                    }
                } else {
                    Write-Error "[Smoke FAILED] Dashboard process exited immediately or failed to start."
                    $SmokeSuccess = $false
                }
            }
            
            # Bước B: Khởi động Worker
            if ($SmokeSuccess) {
                if ([string]::IsNullOrEmpty($ApiToken)) {
                    Write-Host "[Smoke WARNING] Worker smoke test skipped: API_TOKEN is missing or empty in config/.env" -ForegroundColor Yellow
                } else {
                    Write-Host "[Smoke] Launching Crawler Worker..." -ForegroundColor Gray
                    & $StartWorkerScript
                    
                    # 1. Chờ worker.pid được sinh ra
                    Write-Host "[Smoke] Waiting for worker.pid to be generated..." -ForegroundColor Gray
                    $wPidOk = $false
                    $Checks = 0
                    $wPidVal = $null
                    while ($Checks -lt 5 -and !$wPidOk) {
                        Start-Sleep -Seconds 1
                        $Checks++
                        if (Test-Path $WorkerPidFile) {
                            $wPidVal = (Get-Content $WorkerPidFile -Raw) -replace '[^\d]'
                            if ($wPidVal) {
                                $wPidOk = $true
                            }
                        }
                    }
                    
                    if (!$wPidOk) {
                        Write-Error "[Smoke FAILED] worker.pid was not generated by launcher!"
                        $SmokeSuccess = $false
                    } else {
                        $wPidInt = [int]$wPidVal
                        # Chờ thêm 4 giây để worker khởi chạy thực tế
                        Start-Sleep -Seconds 4
                        
                        $wProc = Get-Process -Id $wPidInt -ErrorAction SilentlyContinue
                        if (!$wProc -or $wProc.HasExited) {
                            $ErrLog = Join-Path $ReleaseDir "logs\worker.err.log"
                            $ErrMsg = ""
                            if (Test-Path $ErrLog) {
                                $ErrMsg = Get-Content $ErrLog -Raw -ErrorAction SilentlyContinue
                            }
                            Write-Error "[Smoke FAILED] Crawler Worker process exited immediately! Error logs:`n$ErrMsg"
                            $SmokeSuccess = $false
                        } else {
                            # Kiểm tra xem log stderr có lỗi crash/fatal không
                            $ErrLog = Join-Path $ReleaseDir "logs\worker.err.log"
                            $HasFatal = $false
                            if (Test-Path $ErrLog) {
                                $ErrMsg = Get-Content $ErrLog -Raw -ErrorAction SilentlyContinue
                                if ($ErrMsg -match "Error:" -or $ErrMsg -match "Exception" -or $ErrMsg -match "CRITICAL") {
                                    Write-Error "[Smoke FAILED] Crawler Worker started but reported fatal errors in log:`n$ErrMsg"
                                    $SmokeSuccess = $false
                                    $HasFatal = $true
                                }
                            }
                            if (!$HasFatal) {
                                Write-Host "[Smoke OK] Crawler Worker is running under PID: $wPidInt with no fatal errors." -ForegroundColor Green
                            }
                        }
                    }
                }
            }
            
            # Bước C: Tắt toàn bộ dịch vụ (luôn chạy để dọn dẹp)
            Write-Host "[Smoke] Cleaning up: stopping all services..." -ForegroundColor Gray
            & $StopScript
            
            if ($SmokeSuccess) {
                Write-Host "[SUCCESS] Smoke test completed successfully! Dashboard & Worker verified." -ForegroundColor Green
            } else {
                Write-Host "[FAILED] Smoke test failed!" -ForegroundColor Red
                $Success = $false
            }
        }
    }
}

Write-Host "=============================================================" -ForegroundColor Cyan
if ($Success) {
    Write-Host "[SUCCESS] Health check passed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAILED] Health check encountered critical errors!" -ForegroundColor Red
    exit 1
}
