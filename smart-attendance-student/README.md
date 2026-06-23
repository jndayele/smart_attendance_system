<div align="center">

# 🎓 Student Portal

A mobile-first web application designed for students to easily, securely, and rapidly mark their attendance in class.

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Mobile_First-FF6F00?style=for-the-badge&logo=web&logoColor=white" alt="Mobile First" />
</p>

</div>

---

## ✨ Core Features

- 📸 **Facial Recognition**: Snap a selfie to securely prove your identity. The AI verifies your face in milliseconds.
- 📱 **QR Code Scanner**: Use your phone's camera to seamlessly scan the dynamic QR code projected by the lecturer.
- 📊 **Attendance Trends**: Beautiful charts tracking your attendance history and minimum threshold requirements.
- 🔔 **Real-time Notifications**: Instant confirmations when your attendance is successfully recorded.

---

## 🛠️ Built With

- **React 18** (via Vite)
- **Tailwind CSS**
- **jsQR** (Camera scanning API)
- **Radix UI & shadcn/ui**

---

## 🚀 Getting Started

<details>
<summary><b>Click to expand development instructions</b></summary>
<br>

> **⚠️ Important Note on Camera Access**
> Because this app heavily relies on the device camera, it **must** be served over `HTTPS` in production, or via `localhost` during development. Mobile browsers will block camera access on local IP addresses starting with `http://`.

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
The application will launch on `http://localhost:5175`.
</details>

---

## 📦 Production Build
```bash
npm run build
```
Outputs optimized static files into the `dist` directory.
