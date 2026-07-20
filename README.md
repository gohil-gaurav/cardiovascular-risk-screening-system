# Cardiovascular Risk Screening System

A web application designed for cardiovascular risk screening and analysis, featuring a **FastAPI** backend and a **React (Vite)** frontend.

---

## 📐 Project Structure

```text
cardiovascular-risk-screening-system/
├── backend/                  # FastAPI Backend API
│   ├── app/                  # Application code (main.py, API routes, models)
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Python virtual environment (ignored in git)
├── frontend/                 # React + Vite Frontend
│   ├── src/                  # React components, assets, and API hooks
│   ├── package.json          # Node.js dependencies and scripts
│   └── vite.config.js        # Vite configuration
├── data/                     # Data storage
│   ├── raw/                  # Raw dataset files
│   └── processed/            # Processed / cleaned dataset files
├── models/                   # Trained ML / DL model artifacts
│   ├── machine-learning/     # Classic ML models
│   ├── deep-learning/        # Deep Learning models
│   └── clustering/           # Clustering models
├── notebooks/                # Jupyter Notebooks for data analysis
└── docs/                     # Documentation files
```

---

## 🛠️ Prerequisites

Ensure you have the following installed on your system:
- **Python** (version 3.9 or higher)
- **Node.js** (version 18 or higher) & **npm**
- **Git**

---

## 🚀 How to Run the Project Locally

Follow these steps to set up and run both the Backend and Frontend servers on your local machine.

### 1. Run the Backend (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. **Create a virtual environment** (if not already created):
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the FastAPI dev server**:
   ```bash
   uvicorn app.main:app --reload
   ```

> 🌐 **Backend URLs**:
> - API Base URL: `http://localhost:8000`
> - Swagger UI (API Docs): `http://localhost:8000/docs`

---

### 2. Run the Frontend (React + Vite)

1. Open a **new terminal** window/tab and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

> 🌐 **Frontend URL**:
> - Web Application: `http://localhost:5173`

---

## ✅ Verifying the Connection

1. Ensure both the **Backend** (`http://localhost:8000`) and **Frontend** (`http://localhost:5173`) servers are running simultaneously.
2. Open your browser and navigate to `http://localhost:5173`.
3. You should see the status message: **`Backend Connected Successfully 🚀`**.
