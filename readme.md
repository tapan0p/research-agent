# Project Setup Guide

## Requirements

- Node.js v22+
- Python 3.11+

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/tapan0p/research-agent.git
```

### 2. Frontend Setup
```bash
cd frontend
npm i
npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Running the Application

After completing the setup steps above, your application should be running with:
- Frontend: Usually available at `http://localhost:3000`
- Backend: Usually available at `http://localhost:8000`

Check your terminal output for the exact URLs.