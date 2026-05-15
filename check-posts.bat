@echo off
chcp 65001 > nul
echo ========================================
echo БЫСТРАЯ ПРОВЕРКА ПОСТОВ
echo ========================================
echo.

echo Проверка последних 5 постов в базе данных...
echo.
docker exec pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "SELECT id, user_id, LEFT(body, 60) as body_preview, created_at FROM posts WHERE deleted = FALSE ORDER BY created_at DESC LIMIT 5;"

echo.
echo ========================================
echo.
echo Если постов нет или они не обновляются:
echo 1. Откройте http://localhost в браузере
echo 2. Нажмите F12 для открытия консоли
echo 3. Попробуйте создать пост
echo 4. Посмотрите сообщения с префиксом [POST]
echo.
echo Для просмотра логов backend:
echo   logs-backend.bat
echo.
pause
