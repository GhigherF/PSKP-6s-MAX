@echo off
chcp 65001 >nul
echo ========================================
echo Проверка отправки email из Docker
echo ========================================
echo.

echo 1. Проверка доступа к интернету из backend контейнера...
docker-compose exec backend ping -c 3 8.8.8.8

echo.
echo 2. Проверка доступа к smtp.gmail.com...
docker-compose exec backend ping -c 3 smtp.gmail.com

echo.
echo 3. Проверка DNS резолвинга...
docker-compose exec backend nslookup smtp.gmail.com

echo.
echo ========================================
echo Если все проверки прошли успешно, email должен отправляться.
echo Если есть ошибки - проверьте настройки Docker Desktop:
echo   - Settings ^> Resources ^> Network
echo   - Отключите VPN если используется
echo   - Проверьте firewall/антивирус
echo ========================================
pause
