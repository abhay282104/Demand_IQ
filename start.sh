#!/bin/bash
# DemandIQ - One-Click Startup Script (macOS/Linux)
# This script starts all three components of the application

set -e

echo ""
echo "============================================================"
echo "DemandIQ - AI Demand Forecasting Platform"
echo "============================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.9+ and try again"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 16+ and try again"
    exit 1
fi

# Training model (if needed)
if [ ! -f "backend/app/ml/model.pkl" ]; then
    echo ""
    echo "============================================================"
    echo "STEP 1: Training ML Model"
    echo "============================================================"
    echo ""
    
    if [ ! -d "ml_env" ]; then
        python3 -m venv ml_env
    fi
    
    source ml_env/bin/activate
    pip install -q pandas numpy scikit-learn xgboost joblib
    
    python3 ml/train.py "demand_forecasting_dataset (1).csv"
    
    echo ""
    echo "✓ Model training complete"
    echo ""
fi

# Setup backend
echo ""
echo "============================================================"
echo "STEP 2: Setting Up Backend"
echo "============================================================"
echo ""

cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "============================================================"
echo "STEP 3: Starting Backend Server"
echo "============================================================"
echo ""
echo "Starting FastAPI server on http://localhost:8000"
echo ""

python3 -m app.main &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Navigate back
cd ..

# Setup frontend
echo ""
echo "============================================================"
echo "STEP 4: Setting Up Frontend"
echo "============================================================"
echo ""

cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install -q
fi

echo ""
echo "============================================================"
echo "STEP 5: Starting Frontend"
echo "============================================================"
echo ""
echo "Starting Vite dev server on http://localhost:5173"
echo ""

npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
