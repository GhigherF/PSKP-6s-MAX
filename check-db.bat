@echo off
echo ========================================
echo Проверка состояния Docker контейнеров
echo ========================================
docker ps

echo.
echo ========================================
echo Проверка логов backend
echo ========================================
docker logs pskp-6s-max-backend-1 --tail 50

echo.
echo ========================================
echo Проверка подключения к PostgreSQL
echo ========================================
docker exec pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "SELECT COUNT(*) FROM posts;"

echo.
echo ========================================
echo Проверка таблицы posts
echo ========================================
docker exec pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "\d posts"

echo.
echo Нажмите любую клавишу для выхода...
pause > nul
