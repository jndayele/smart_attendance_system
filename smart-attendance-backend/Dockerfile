FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for face recognition, OpenCV, and PostgreSQL
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway injects $PORT dynamically — must use shell form so the variable expands
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
