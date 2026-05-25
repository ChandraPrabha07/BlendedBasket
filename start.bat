@echo off
echo =========================================
echo    BlendedBasket Initialization Script
echo =========================================
echo.

echo [1/4] Installing Backend Dependencies...
call npm install

echo.
echo [2/4] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/4] Starting Backend Server...
start "BlendedBasket Backend" cmd /c "node server.js"

echo.
echo [4/4] Starting Frontend Vite Server...
start "BlendedBasket Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo =========================================
echo Everything is starting up! 
echo Keep the terminal windows open.
echo =========================================
pause
