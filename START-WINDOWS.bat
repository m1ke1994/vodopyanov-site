@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing
where npm >nul 2>nul
if errorlevel 1 goto missing
if exist node_modules goto run
echo Устанавливаем зависимости. При первом запуске нужен интернет.
call npm ci --no-audit --no-fund
if errorlevel 1 goto failed
:run
echo Сайт: http://127.0.0.1:5173
echo Для остановки нажмите Ctrl+C.
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort --open
if errorlevel 1 goto failed
exit /b 0
:missing
echo Установите Node.js 22.12 или новее: https://nodejs.org/
echo После установки заново откройте этот файл.
pause
exit /b 1
:failed
echo Не удалось запустить сайт. Ошибка показана выше.
echo Если порт 5173 занят, остановите другую копию сайта.
pause
exit /b 1
