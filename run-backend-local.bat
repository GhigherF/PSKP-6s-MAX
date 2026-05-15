@echo off
chcp 65001 >nul
echo ========================================
echo Запуск Backend ЛОКАЛЬНО (вне Docker)
echo ========================================
echo.

echo Это решение гарантирует отправку email через Gmail.
echo Backend запустится локально, но будет использовать PostgreSQL из Docker.
echo.

echo 1. Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Node.js не установлен!
    echo Скачайте с https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js найден: 
node --version

echo.
echo 2. Остановка backend в Docker...
docker compose stop backend

echo.
echo 3. Переход в папку backend...
cd backend

echo.
echo 4. Установка зависимостей (если нужно)...
if not exist "node_modules" (
    echo Установка npm пакетов...
    call npm install
)

echo.
echo 5. Создание локального .env файла...
(
echo JWT_SECRET=somereallylongfckingstringtopreventsomepenetrationintomygorgeuouscouseworkthatwasdefinetelynotvibecoded111!!!$5@@!$*^&*yeeeeaaah!
echo JWT_EXPIRES_IN=7d
echo GMAIL_USER=microbloges@gmail.com
echo GMAIL_PASSWORD=wyiwhbevvyabxrxp
echo GMAIL_FROM_NAME=Micro Blog
echo PGHOST=localhost
echo PGUSER=postgres
echo PGPASSWORD=postgres
echo PGDATABASE=microblog
echo PORT=4000
echo NODE_ENV=development
) > .env.local

echo.
echo 6. Запуск backend локально...
echo Backend будет доступен на http://localhost:4000
echo Для остановки нажмите Ctrl+C
echo.
echo ========================================
echo ВАЖНО: Оставьте это окно открытым!
echo ========================================
echo.

set PGHOST=localhost
set PGUSER=postgres
set PGPASSWORD=postgres
set PGDATABASE=microblog
set PORT=4000
set JWT_SECRET=somereallylongfckingstringtopreventsomepenetrationintomygorgeuouscouseworkthatwasdefinetelynotvibecoded111!!!$5@@!$*^&*yeeeeaaah!
set JWT_EXPIRES_IN=7d
set GMAIL_USER=microbloges@gmail.com
set GMAIL_PASSWORD=wyiwhbevvyabxrxp
set GMAIL_FROM_NAME=Micro Blog
set NODE_ENV=development

node index.js
