@echo off
echo Установка сертификата в доверенные корневые центры сертификации...
certutil -addstore -f "ROOT" "%~dp0nginx\certs\cert.pem"
if %errorlevel% == 0 (
    echo.
    echo [OK] Сертификат успешно установлен.
    echo.
    echo Проверяем запись в hosts...
    findstr /i "microblog" C:\Windows\System32\drivers\etc\hosts >nul 2>&1
    if %errorlevel% neq 0 (
        echo 127.0.0.1 microblog>> C:\Windows\System32\drivers\etc\hosts
        echo [OK] Добавлена запись: 127.0.0.1 microblog
    ) else (
        echo [OK] Запись microblog уже есть в hosts.
    )
    echo.
    echo Перезапустите браузер и перейдите на https://microblog
) else (
    echo.
    echo [ОШИБКА] Запустите скрипт от имени Администратора.
)
pause
