<div align="center">

# 🎓 Smart Attendance System

An enterprise-grade solution for modern educational institutions leveraging state-of-the-art **Facial Recognition** and **Dynamic QR Codes** to provide secure, lightning-fast, and anti-cheat attendance tracking.

<p>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/version-1.0.0-brightgreen.svg" alt="Version" />
  <img src="https://img.shields.io/badge/built_with-FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/built_with-React-61DAFB?logo=react&logoColor=black" alt="React" />
</p>

</div>

---

## 📖 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Quick Start Guide](#-quick-start-guide)
- [Security & Privacy](#-security--privacy)

---

## 🏗️ Architecture Overview

The system is built using a highly scalable microservices architecture. It is divided into four main components:

| Component | Description | Tech Stack |
| :--- | :--- | :--- |
| **[Backend Engine](./smart-attendance-backend)** | Core API, database, and background processing engine. | <img src="https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi"/> |
| **[Admin Portal](./smart-attendance-admin)** | Control center for administrators to manage the institution. | <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB"/> |
| **[Lecturer Portal](./smart-attendance-lecturer)** | For lecturers to project dynamic QR codes and monitor live attendance. | <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB"/> |
| **[Student Portal](./smart-attendance-student)** | Mobile-first web app for students to scan QR codes and verify faces. | <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB"/> |

---

## ✨ Key Features

- **🚀 Highly Scalable**: Built to handle 400+ students taking attendance simultaneously.
- **📸 AI Facial Recognition**: Verifies identities using `pgvector` for `<5ms` lightning-fast identity checks.
- **📱 Dynamic QR Codes**: Emits rotating QR codes via WebSockets to prevent screenshot sharing.
- **⏱️ Real-time Updates**: Live attendance feeds broadcasted directly to the Lecturer dashboard via Socket.IO.
- **🛡️ Anti-Cheat Mechanisms**: Geolocation restrictions, device binding, and active liveness checks.

---

## 🚀 Quick Start Guide

<details>
<summary><b>Click to expand local setup instructions</b></summary>
<br>

To run the entire system locally, you will need to start the backend and the three frontend portals. 

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **PostgreSQL** (with the `pgvector` extension installed)
- **Redis Server**

### 1. Start the Backend
Navigate to the backend directory and follow its [README](./smart-attendance-backend/README.md) to start the API and Celery workers.
```bash
cd smart-attendance-backend
# See backend README for detailed launch instructions
```

### 2. Start the Frontend Portals
Open three new terminal windows and run the following for the Admin, Lecturer, and Student portals:
```bash
# Terminal 1
cd smart-attendance-admin
npm install && npm run dev

# Terminal 2
cd smart-attendance-lecturer
npm install && npm run dev

# Terminal 3
cd smart-attendance-student
npm install && npm run dev
```
</details>

---

## 🔒 Security & Privacy
Face encodings are stored as mathematical 512-dimensional vectors using `pgvector`, not as raw images. This ensures student privacy is rigorously maintained, even in the highly unlikely event of a database breach.

<div align="center">
  <br>
  <p>Made with ❤️ for educational institutions.</p>
</div>
