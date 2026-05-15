@echo off
chcp 65001 >nul
echo ========================================
echo Диагностика и исправление Docker сети
echo ========================================
echo.

echo 1. Перезапуск Docker Desktop...
echo Закройте Docker Desktop вручную, затем нажмите любую клавишу
pause >nul

echo Запуск Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
timeout /t 15 /nobreak >nul

echo.
echo 2. Проверка WSL2...
wsl --list --verbose

echo.
echo 3. Перезапуск WSL2...
wsl --shutdown
timeout /t 5 /nobreak >nul

echo.
echo 4. Запуск Docker снова...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
timeout /t 20 /nobreak >nul

echo.
echo 5. Проверка сети из контейнера...
cd /d "%~dp0"
docker compose exec backend ping -c 3 8.8.8.8

echo.
echo ========================================
echo Если ping не работает:
echo 1. Откройте Docker Desktop
echo 2. Settings → Resources → Network
echo 3. Убедитесь что "Enable network" включен
echo 4. Перезапустите Docker Desktop
echo ========================================
pause
