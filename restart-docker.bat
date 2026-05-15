@echo off
chcp 65001 >nul
echo ========================================
echo Перезапуск Docker с новыми настройками
echo ========================================
echo.

echo Остановка контейнеров...
docker compose down

echo.
echo Пересборка backend...
docker compose build backend

echo.
echo Запуск контейнеров...
docker compose up -d

echo.
echo Ожидание запуска (10 сек)...
timeout /t 10 /nobreak >nul

echo.
echo Проверка логов backend...
docker compose logs backend | findstr "Backend"

echo.
echo ========================================
echo Готово! Попробуйте сменить email в интерфейсе.
echo Для просмотра логов: docker compose logs -f backend
echo ========================================
pause
