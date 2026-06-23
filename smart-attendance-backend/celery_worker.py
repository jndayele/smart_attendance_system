"""
celery_worker.py

Optional entry point for running Celery workers programmatically,
though running `celery -A app.celery_app worker` from the terminal
is the standard approach.
"""
import os
import sys

# Ensure the app directory is in the path
sys.path.insert(0, os.path.dirname(__file__))

from app.celery_app import celery_app

if __name__ == "__main__":
    celery_app.start()
