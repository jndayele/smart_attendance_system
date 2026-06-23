<div align="center">

# 👨‍🏫 Lecturer Portal

Designed for educators to seamlessly manage classes and track student attendance in real-time. Eliminates paper registers forever.

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
</p>

</div>

---

## ✨ Core Features

- 📅 **Session Management**: Create, start, and lock attendance sessions with a single click.
- 📱 **Dynamic QR Projection**: Project rotating QR codes that automatically refresh to prevent screenshot sharing.
- 📡 **Live Dashboard**: Watch the attendance roster populate in real-time as students check-in. No page refreshes needed.
- ✍️ **Manual Overrides**: Easily mark students present, absent, or excused.

---

## 🛠️ Built With

- **React 18** (via Vite)
- **Tailwind CSS**
- **Socket.IO Client** (Real-time data)
- **Radix UI & shadcn/ui**

---

## 🚀 Getting Started

<details>
<summary><b>Click to expand development instructions</b></summary>
<br>

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file pointing to your backend:
```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5174`.
</details>

---

## 📦 Production Build
```bash
npm run build
```
Outputs optimized static files into the `dist` directory.
