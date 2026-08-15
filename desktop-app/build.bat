@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\build-runtime-package.ps1"
pause
