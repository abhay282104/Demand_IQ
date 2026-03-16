# DemandIQ - AI Demand Forecasting Platform

DemandIQ is a full-stack AI-driven web application designed to forecast and predict demand using advanced machine learning models. 

## 🚀 Key Features

- **AI Demand Forecasting**: Uses XGBoost and scikit-learn models to process and predict future demand from datasets.
- **Interactive Dashboard**: Modern, responsive frontend built with React, TailwindCSS, and Recharts.
- **Robust API**: High-performance backend powered by FastAPI.
- **User Authentication**: Secure user login, registration, password reset, and session management.
- **Data Management**: Flexible data storage with MongoDB.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Recharts, Lucide-React
- **Backend**: FastAPI, Pydantic, PyMongo, Uvicorn
- **Machine Learning**: Pandas, NumPy, scikit-learn, XGBoost, Joblib
- **Database**: MongoDB

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Python 3.9+**
- **Node.js 16+**
- **MongoDB** (running locally or via a cloud instance)

---

## 🏎️ Quick Start (One-Click Setup)

The repository provides startup scripts to automatically install dependencies, train the initial ML model (if not already trained), and start both the backend and frontend servers simultaneously.

### Windows
Double-click `start.bat` or run it from the command line:
```cmd
.\start.bat
```

### macOS / Linux
Run the shell script:
```bash
chmod +x start.sh
./start.sh
```

---

## 🛠️ Manual Setup Instructions

If you prefer to start the services manually, follow these steps:

### 1. Database Setup
Ensure that the MongoDB service is running on your machine default port `27017`.

### 2. Machine Learning Model Training (First run only)
The application requires a trained model `model.pkl` to be located in `backend/app/ml/` (which `start.bat` handles and places appropriately). 
To manually train the model:
```bash
# Set up a python environment if you haven't
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install required packages
pip install pandas numpy scikit-learn xgboost joblib

# Run the training script with the provided dataset
python ml/train.py "demand_forecasting_dataset (1).csv"
```

### 3. Backend Setup
Navigate to the `backend` directory, install dependencies, and run the FastAPI server:
```bash
cd backend

# Use existing venv or create a new one
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m app.main
# Server will run on http://localhost:8000
```

### 4. Frontend Setup
Navigate to the `frontend` directory, install Node dependencies, and start the Vite dev server:
```bash
cd frontend

# Install packages
npm install

# Start the development server
npm run dev
# Server will run on http://localhost:5173
```

---

## 📂 Project Structure

```
Demand_IQ/
├── backend/            # FastAPI python application
│   ├── app/            # Main application logic (routers, models, schemas)
│   ├── requirements.txt# Backend dependencies
├── frontend/           # React + Vite web application
│   ├── src/            # React components, pages, and context
│   ├── package.json    # Frontend dependencies
├── ml/                 # Machine learning scripts and utilities
│   ├── train.py        # Model training script
├── start.bat           # Windows startup script
├── start.sh            # Linux/macOS startup script
└── README.md           # Project documentation
```
