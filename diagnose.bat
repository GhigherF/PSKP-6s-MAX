@echo off
chcp 65001 > nul
echo ========================================
echo ПОЛНАЯ ДИАГНОСТИКА СИСТЕМЫ
echo ========================================
echo.

echo [1/6] Проверка Docker контейнеров...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [2/6] Проверка подключения к PostgreSQL...
docker exec pskp-6s-max-postgres-1 pg_isready -U postgres
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL не отвечает!
    goto :end
) else (
    echo ✅ PostgreSQL работает
)
echo.

echo [3/6] Проверка таблицы posts...
docker exec pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "SELECT COUNT(*) as total_posts FROM posts;"
echo.

echo [4/6] Проверка последних постов...
docker exec pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "SELECT id, user_id, LEFT(body, 50) as body_preview, created_at FROM posts ORDER BY created_at DESC LIMIT 3;"
echo.

echo [5/6] Проверка пользователей...
docker exec pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "SELECT id, nick, email FROM users LIMIT 5;"
echo.

echo [6/6] Последние 20 строк логов backend...
docker logs pskp-6s-max-backend-1 --tail 20
echo.

echo ========================================
echo ДИАГНОСТИКА ЗАВЕРШЕНА
echo ========================================
echo.
echo Если посты не создаются:
echo 1. Откройте браузер и нажмите F12
echo 2. Перейдите на вкладку Console
echo 3. Попробуйте создать пост
echo 4. Посмотрите сообщения с [POST]
echo.
echo Для просмотра логов в реальном времени:
echo   logs-backend.bat
echo.

:end
pause
