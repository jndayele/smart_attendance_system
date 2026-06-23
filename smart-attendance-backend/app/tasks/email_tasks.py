"""
app/tasks/email_tasks.py

Celery tasks for all outbound email sending.

Why offload emails to Celery?
------------------------------
Every attendance mark previously called send_attendance_warning_email()
synchronously inside the HTTP request, adding 100–500 ms of SMTP latency
to every response.  Under 400 concurrent students this creates a backlog of
SMTP connections and dramatically increases p95/p99 response times.

By dispatching emails to this Celery task, the HTTP response returns the
moment the DB write succeeds (< 50 ms).  Email delivery happens asynchronously
in a worker process with automatic retry on SMTP failure.
"""
import asyncio
import logging
from typing import List, Optional

from celery import shared_task

logger = logging.getLogger(__name__)


def _run(coro):
    """Run an async coroutine synchronously inside a Celery worker."""
    return asyncio.run(coro)


@shared_task(
    name="app.tasks.email_tasks.send_attendance_warning",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def send_attendance_warning(
    to_email: str,
    student_name: str,
    course_title: str,
    course_code: str,
    current_pct: float,
    threshold_pct: int,
    sessions_needed: int,
):
    from app.services.email_service import send_attendance_warning_email
    _run(send_attendance_warning_email(
        to_email=to_email,
        student_name=student_name,
        course_title=course_title,
        course_code=course_code,
        current_pct=current_pct,
        threshold_pct=threshold_pct,
        sessions_needed=sessions_needed,
    ))


@shared_task(
    name="app.tasks.email_tasks.send_lecturer_activation",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def send_lecturer_activation(to_email: str, lecturer_name: str, activation_link: str):
    from app.services.email_service import send_lecturer_activation_email
    _run(send_lecturer_activation_email(to_email, lecturer_name, activation_link))


@shared_task(
    name="app.tasks.email_tasks.send_student_invitation",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def send_student_invitation(
    to_email: str,
    student_name: str,
    student_id: str,
    courses: List[str],
    invitation_link: str,
):
    from app.services.email_service import send_student_invitation_email
    _run(send_student_invitation_email(to_email, student_name, student_id, courses, invitation_link))


@shared_task(
    name="app.tasks.email_tasks.send_password_reset",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def send_password_reset(to_email: str, name: str, reset_link: str):
    from app.services.email_service import send_password_reset_email
    _run(send_password_reset_email(to_email, name, reset_link))


@shared_task(
    name="app.tasks.email_tasks.send_weekly_summary",
    max_retries=2,
    acks_late=True,
)
def send_weekly_summary(to_email: str, recipient_name: str, summary_data: dict):
    from app.services.email_service import send_weekly_summary_email
    _run(send_weekly_summary_email(to_email, recipient_name, summary_data))


@shared_task(
    name="app.tasks.email_tasks.send_lecturer_warning",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def send_lecturer_warning(
    to_email: str,
    lecturer_name: str,
    student_name: str,
    student_id: str,
    course_title: str,
    course_code: str,
    current_pct: float,
    threshold_pct: int,
):
    from app.services.email_service import send_lecturer_attendance_warning_email
    _run(send_lecturer_attendance_warning_email(
        to_email=to_email,
        lecturer_name=lecturer_name,
        student_name=student_name,
        student_id=student_id,
        course_title=course_title,
        course_code=course_code,
        current_pct=current_pct,
        threshold_pct=threshold_pct,
    ))
