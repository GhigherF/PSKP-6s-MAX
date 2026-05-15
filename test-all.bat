@echo off
chcp 65001 > nul
echo ========================================
echo ФИНАЛЬНАЯ ПРОВЕРКА
echo ========================================
echo.

echo [1] Проверка постов в БД...
docker exec pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "SELECT id, user_id, LEFT(body, 40) as body, deleted FROM posts ORDER BY created_at DESC LIMIT 5;"
echo.

echo [2] Проверка backend...
docker logs pskp-6s-max-backend-1 --tail 5
echo.

echo ========================================
echo ЧТО ДЕЛАТЬ ДАЛЬШЕ:
echo ========================================
echo.
echo 1. Откройте http://localhost в браузере
echo 2. Нажмите F12 и выполните в консоли:
echo.
echo    localStorage.removeItem('viewed_posts');
echo    location.reload();
echo.
echo 3. Посты должны появиться!
echo.
echo Если не помогло - перезапустите:
echo    restart-docker.bat
echo.
pause
