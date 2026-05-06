@echo off
cd /d "%~dp0"
docker stop pskp-6s-max-nginx-1
docker stop pskp-6s-max-frontend-1
docker stop pskp-6s-max-backend-1
docker stop pskp-6s-max-postgres-1
