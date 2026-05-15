# Запуск от имени администратора
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Требуются права администратора! Перезапуск..."
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Разблокировка SMTP портов для Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Разрешаем исходящие подключения на SMTP порты
Write-Host "1. Разрешаем исходящие подключения на порт 587 (SMTP STARTTLS)..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Docker SMTP 587" -Direction Outbound -LocalPort 587 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host "2. Разрешаем исходящие подключения на порт 465 (SMTP SSL)..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Docker SMTP 465" -Direction Outbound -LocalPort 465 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host "3. Разрешаем исходящие подключения на порт 25 (SMTP)..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Docker SMTP 25" -Direction Outbound -LocalPort 25 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Готово! SMTP порты разблокированы." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь перезапустите Docker:" -ForegroundColor Yellow
Write-Host "  docker compose restart backend" -ForegroundColor White
Write-Host ""

Pause
