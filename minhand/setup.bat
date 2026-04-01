@echo off
echo.
echo ============================================
echo   MinHand — Minutes In Hand
echo   Full Stack + AI/ML Startup Script
echo ============================================
echo.

echo [1/3] Starting MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo    OK: MongoDB started
) else (
    echo    OK: MongoDB already running
)

echo.
echo [2/3] Backend setup check...
if not exist backend\.env (
    echo    Copying .env.example to .env...
    copy backend\.env.example backend\.env >nul
)

echo.
echo [3/3] ML Service setup check...
if not exist ml-service\.env (
    copy ml-service\.env.example ml-service\.env >nul
)

echo.
echo ============================================
echo   HOW TO START (open 3 terminals):
echo ============================================
echo.
echo   Terminal 1 - Backend:
echo     cd backend
echo     npm install
echo     node config/seed.js
echo     npm run dev
echo.
echo   Terminal 2 - ML Service (Python):
echo     cd ml-service
echo     pip install -r requirements.txt
echo     python app.py
echo.
echo   Terminal 3 - Frontend:
echo     cd frontend
echo     npm install
echo     npm start
echo.
echo   Browser: http://localhost:3000
echo   Admin:   admin@minhand.com / Admin@123456
echo.
pause
