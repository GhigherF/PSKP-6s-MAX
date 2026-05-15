@echo off
chcp 65001 >nul
echo ========================================
echo Разблокировка SMTP портов для Docker
echo ========================================
echo.

echo Требуются права администратора!
echo Нажмите Да в окне UAC...
echo.

powershell -Command "Start-Process cmd -ArgumentList '/c netsh advfirewall firewall add rule name=\"Docker SMTP 587\" dir=out action=allow protocol=TCP remoteport=587 & netsh advfirewall firewall add rule name=\"Docker SMTP 465\" dir=out action=allow protocol=TCP remoteport=465 & netsh advfirewall firewall add rule name=\"Docker SMTP 25\" dir=out action=allow protocol=TCP remoteport=25 & pause' -Verb RunAs"

echo.
echo Готово! Теперь перезапустите Docker:
echo   docker compose restart backend
echo.
pause
