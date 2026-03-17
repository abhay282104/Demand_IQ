@echo off
REM DemandIQ - One-Click Startup Script
REM This script starts all three components of the application

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo DemandIQ - AI Demand Forecasting Platform
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ and add it to your PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and add it to your PATH
    pause
    exit /b 1
)

REM Check if MongoDB is available
echo.
echo ============================================================
echo STEP 1: Checking MongoDB
echo ============================================================
echo.

echo Skip MongoDB local check. Relying on Atlas DB...

REM Setup backend
echo.
echo ============================================================
echo STEP 2: Setting Up Backend
echo ============================================================
echo.

cd backend

if not exist "venv" (
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt 2>nul

REM Train model (if needed) — reuse backend venv
cd ..
if not exist "backend\app\ml\model.pkl" (
    echo.
    echo ============================================================
    echo STEP 3: Training ML Model
    echo ============================================================
    echo.

    cd backend
    python ..\ml\train.py "..\demand_forecasting_dataset (1).csv"

    if errorlevel 1 (
        echo.
        echo ERROR: Model training failed
        pause
        exit /b 1
    )

    echo.
    echo ✓ Model training complete
    echo.
    cd ..
)

cd backend

echo.
echo ============================================================
echo STEP 4: Starting Backend Server
echo ============================================================
echo.
echo Checking for existing backend process on port 8000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Stopping stale backend process PID %%p
    taskkill /PID %%p /F >nul 2>&1
)

echo Starting FastAPI server on http://localhost:8000
echo.

start /b "" venv\Scripts\python.exe -m app.main

REM Give backend time to start
timeout /t 3 /nobreak

REM Navigate back
cd ..

REM Setup frontend
echo.
echo ============================================================
echo STEP 4: Setting Up Frontend
echo ============================================================
echo.

cd frontend

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install -q
)

echo.
echo ============================================================
echo STEP 5: Starting Frontend
echo ============================================================
echo.
echo Starting Vite dev server on http://localhost:5173
echo.

call npm run dev

pause
