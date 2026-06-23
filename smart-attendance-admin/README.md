<div align="center">

# 🏢 Admin Portal

The central command center for school administrators. Provides full institutional control and advanced reporting analytics.

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</p>

</div>

---

## ✨ Core Features

- 🏫 **Institution Management**: Configure global settings, semesters, and academic years.
- 👨‍🏫 **Staff Directory**: Add, suspend, and manage lecturer accounts securely.
- 🎓 **Student Roster**: Bulk upload via CSV, manage facial registrations, and handle course enrollments.
- 📊 **Advanced Analytics**: Interactive charts for university-wide attendance trends and PDF/Excel reporting.

---

## 🛠️ Built With

- **React 18** (via Vite)
- **Tailwind CSS**
- **Radix UI & shadcn/ui**
- **TanStack Query** (React Query)
- **Lucide React Icons**

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
The application will launch on `http://localhost:5173`.
</details>

---

## 📦 Production Build
```bash
npm run build
```
Outputs optimized static files into the `dist` directory.
