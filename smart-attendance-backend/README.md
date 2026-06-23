<div align="center">

# ⚙️ Backend Engine

The powerhouse of the Smart Attendance System. Handles complex background processing, facial recognition, and live WebSocket broadcasts.

<p>
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
</p>

</div>

---

## 📖 Table of Contents
- [Tech Stack](#-tech-stack)
- [Setup Instructions (Without Docker)](#-setup-instructions-without-docker)
- [Running the System (Production Ready)](#️-running-the-system-production-ready)
- [API Documentation](#-api-documentation)

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **FastAPI** | Core asynchronous web framework |
| **PostgreSQL + pgvector** | Primary database and vector similarity search engine |
| **Redis** | In-Memory cache, message broker, and Socket.IO adapter |
| **Celery** | Distributed task queue for CPU-bound face recognition |
| **DeepFace** | State-of-the-art facial recognition AI model |
| **Socket.IO** | Real-time bidirectional event broadcasting |

---

## 🚀 Setup Instructions (Without Docker)

<details>
<summary><b>Click to expand setup instructions</b></summary>
<br>

### 1. Prerequisites
Ensure you have **PostgreSQL** and **Redis** running locally. Your PostgreSQL instance **must** have the `pgvector` extension installed.

### 2. Virtual Environment Setup
```bash
# Create a virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the root of the backend directory:
```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost/smart_attendance
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

### 4. Database Migrations
Run Alembic to create your tables and initialize the `pgvector` columns:
```bash
alembic upgrade head
```
</details>

---

## 🏃‍♂️ Running the System (Production Ready)

To handle the heavy load of facial recognition, we use a scalable "Waiter & Chef" architecture. Open **three separate terminals**, activate your virtual environment in each, and run the following:

#### Terminal 1: The API Server (The Waiters)
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Terminal 2: Celery Workers (The Chefs)
```bash
celery -A app.celery_app worker --concurrency=4 --loglevel=info --pool=prefork
```

#### Terminal 3: Celery Beat (The Manager)
```bash
celery -A app.celery_app beat --loglevel=info
```

---

## 📡 API Documentation
Once the API is running, view the interactive auto-generated documentation:
- ⚡ **Swagger UI**: `http://localhost:8000/docs`
- 📚 **ReDoc**: `http://localhost:8000/redoc`
