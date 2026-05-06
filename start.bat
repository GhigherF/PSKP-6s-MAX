@echo off
cd /d "%~dp0"
docker start pskp-6s-max-postgres-1
docker start pskp-6s-max-backend-1
docker start pskp-6s-max-frontend-1
docker start pskp-6s-max-nginx-1
