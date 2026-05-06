@echo off
cd /d "%~dp0"
docker compose down -v
docker compose build
docker compose create
docker start pskp-6s-max-postgres-1
timeout /t 5 /nobreak >nul
docker start pskp-6s-max-backend-1
docker start pskp-6s-max-frontend-1
docker start pskp-6s-max-nginx-1
