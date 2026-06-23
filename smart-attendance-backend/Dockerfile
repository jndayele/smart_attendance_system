FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for face recognition and pgvector
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download DeepFace models (optional but recommended for production)
# RUN python -c "from deepface import DeepFace; DeepFace.build_model('ArcFace')"

# Copy application code
COPY . .

# Expose API port
EXPOSE 8000

# Command to run API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
