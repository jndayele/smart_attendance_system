# Smart Attendance System Backend

## Prerequisites
- Python 3.11+ installed
- Git
- A Supabase account (free tier is fine)
- A Cloudinary account (free tier is fine)

## Installation Steps (run these in order)

1. Clone or create the project directory
   ```bash
   mkdir smart-attendance-backend
   cd smart-attendance-backend
   ```

2. Create virtual environment
   ```bash
   python -m venv venv
   ```

3. Activate virtual environment
   - **Windows:** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`

4. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
   > **Note:** TensorFlow (~500MB) will be downloaded. This is normal. First run will also download ArcFace weights (~250MB).

5. Create a Supabase project
   - Go to [Supabase](https://supabase.com) and sign in
   - Click "New Project"
   - Name it: `smart-attendance`
   - Set a strong database password (save this — you need it)
   - Choose the region closest to you
   - Wait ~2 minutes for provisioning to complete

   **Get your connection string:**
   - Go to Project Settings → Database
   - Click the "Connection String" tab
   - Select "URI" format
   - Copy the string — looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`
   - Change `postgresql://` to `postgresql+asyncpg://`
   - Replace `[YOUR-PASSWORD]` with your actual database password

6. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in:
   - `DATABASE_URL` (your Supabase connection string from step 5)
   - `JWT_SECRET_KEY` (generate a random 32+ character string)
   - `APP_SECRET_KEY` (generate a different random 32+ character string)
   - Cloudinary credentials (from cloudinary.com dashboard)
   - Email/SMTP credentials (Gmail app password recommended)

7. Run database migrations
   ```bash
   alembic upgrade head
   ```
   This creates all tables in your Supabase database. You can verify by going to Supabase → Table Editor.

8. Start the development server
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   > **Note:** First startup downloads ArcFace model weights (~250MB). This only happens once — they are cached after.

9. Open API documentation
   http://localhost:8000/docs

10. Complete first-time setup
    Call `POST /api/v1/auth/setup` with your institution details.
    This creates the admin account and enables the system.
    After this, log in at `POST /api/v1/auth/login`.

## Project Structure Overview
- `app/models/` → Database table definitions
- `app/schemas/` → Request and response data shapes
- `app/routers/` → API endpoints (admin, lecturer, student)
- `app/services/` → Business logic (face recognition, email, QR, reports)
- `app/utils/` → Helper functions (security, validators)

## Running Tests
```bash
pytest tests/ -v
```

## Deployment (Railway or Render)
- Push code to GitHub
- Connect repo to Railway or Render
- Add all `.env` variables in the platform's environment settings
- Platform will run: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
