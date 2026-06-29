import logging
from typing import List, Dict, Any
import asyncio
from functools import partial

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# ─── Brevo REST API client ────────────────────────────────────────────────────
# Uses HTTPS/443 — works on Railway free tier (no SMTP port restrictions).

def _get_brevo_api():
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))


async def _send_html_email(subject: str, email_to: str, html_content: str):
    """Send transactional email via Brevo REST API (HTTPS, Railway-compatible)."""
    api_instance = _get_brevo_api()
    send_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": email_to}],
        sender={"name": settings.MAIL_FROM_NAME, "email": settings.MAIL_FROM},
        subject=subject,
        html_content=html_content
    )
    try:
        # Run blocking SDK call in a thread so we don't block the event loop
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, partial(api_instance.send_transac_email, send_email))
    except ApiException as e:
        logger.error(f"Brevo API error sending to {email_to}: {e}")
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {e}")

async def send_lecturer_activation_email(to_email: str, lecturer_name: str, activation_link: str) -> None:
    subject = f"Activate Your Lecturer Account — {settings.APP_NAME}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Welcome, {lecturer_name}! You've been added as a lecturer.</p>
        <p>Please click the button below to set your password and activate your account:</p>
        <a href="{activation_link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Activate Account</a>
        <p>This link expires in 72 hours.</p>
        <hr>
        <p><small>{settings.APP_NAME} Admin Team</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_student_invitation_email(to_email: str, student_name: str, student_id: str, courses: List[str], invitation_link: str) -> None:
    subject = f"Complete Your Student Registration — {settings.APP_NAME}"
    courses_html = "".join([f"<li>{c}</li>" for c in courses])
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Welcome, {student_name} ({student_id})!</p>
        <p>You have been enrolled in the following courses:</p>
        <ul>{courses_html}</ul>
        <p>Please complete your registration and upload your face photo by clicking the link below:</p>
        <a href="{invitation_link}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Complete Registration</a>
        <p><strong>Reminder:</strong> Please ensure your photo clearly shows your face, with good lighting and no accessories obscuring your features.</p>
        <p>This link expires in 48 hours.</p>
        <hr>
        <p><small>{settings.APP_NAME} Admin Team</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_password_reset_email(to_email: str, name: str, reset_link: str) -> None:
    subject = f"Password Reset Request — {settings.APP_NAME}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Hi {name},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link expires in 30 minutes.</p>
        <hr>
        <p><small>{settings.APP_NAME} Admin Team</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_attendance_warning_email(to_email: str, student_name: str, course_title: str, course_code: str, current_pct: float, threshold_pct: int, sessions_needed: int) -> None:
    subject = f"Attendance Warning: {course_code} — {settings.APP_NAME}"
    color = "red" if current_pct < threshold_pct else "orange"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Dear {student_name},</p>
        <p>This is an automated warning regarding your attendance in <strong>{course_code} - {course_title}</strong>.</p>
        <p>Your current attendance is <span style="color: {color}; font-weight: bold;">{current_pct:.1f}%</span>.</p>
        <p>The minimum required attendance threshold is <strong>{threshold_pct}%</strong>.</p>
        <p>You need to attend approximately <strong>{sessions_needed}</strong> consecutive sessions to recover to the threshold.</p>
        <p>Please treat this matter with urgency.</p>
        <hr>
        <p><small>{settings.APP_NAME} Admin Team</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_weekly_summary_email(to_email: str, recipient_name: str, summary_data: Dict[str, Any]) -> None:
    subject = f"Weekly Attendance Summary — {settings.APP_NAME}"
    
    rows = ""
    for item in summary_data.get("courses", []):
        rows += f"<tr><td>{item['course_code']}</td><td>{item['attendance_rate']:.1f}%</td></tr>"
        
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME} Weekly Summary</h2>
        <p>Hi {recipient_name},</p>
        <p>Here is your weekly attendance summary:</p>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <thead><tr><th>Course</th><th>Avg Attendance</th></tr></thead>
            <tbody>{rows}</tbody>
        </table>
        <hr>
        <p><small>{settings.APP_NAME} Admin Team</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_registration_confirmation_email(to_email: str, student_name: str, student_id: str) -> None:
    subject = f"Registration Complete — {settings.APP_NAME}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Hi {student_name} ({student_id}),</p>
        <p>Your account setup and facial registration are now complete!</p>
        <p>You can now use the Smart Attendance System to seamlessly check into your classes.</p>
        <hr>
        <p><small>{settings.APP_NAME} Admin Team</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_test_email(to_email: str) -> None:
    subject = f"SMTP Test — {settings.APP_NAME}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>This is a test email to confirm your SMTP configuration is working correctly.</p>
        <hr>
        <p><small>{settings.APP_NAME} Admin Team</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)


async def send_session_not_closed_email(
    to_email: str,
    lecturer_name: str,
    course_title: str,
    course_code: str,
    session_label: str,
    hours_open: float
) -> None:
    subject = f"Open Session Reminder — {course_code}"
    label_text = f"'{session_label}' " if session_label else ""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Hi {lecturer_name},</p>
        <p>This is a reminder that your session {label_text}for <strong>{course_code} - {course_title}</strong> has been open for {hours_open:.1f} hours.</p>
        <p>Please remember to end the session to finalise attendance records.</p>
        <hr>
        <p><small>{settings.APP_NAME} System Notification</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)


async def send_weekly_lecturer_summary_email(
    to_email: str,
    lecturer_name: str,
    courses_summary: List[Dict[str, Any]]
) -> None:
    subject = f"Weekly Attendance Summary — {settings.APP_NAME}"
    
    rows = ""
    total_at_risk = 0
    for item in courses_summary:
        rows += f"<tr><td>{item['course_code']}</td><td>{item['sessions_this_week']}</td><td>{item['avg_attendance_pct']:.1f}%</td><td>{item['at_risk_count']}</td></tr>"
        total_at_risk += item['at_risk_count']
        
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Hi {lecturer_name},</p>
        <p>Here is your weekly attendance summary:</p>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; text-align: left;">
            <thead><tr><th>Course</th><th>Sessions This Week</th><th>Avg Attendance %</th><th>At-Risk Students</th></tr></thead>
            <tbody>{rows}</tbody>
        </table>
        <p><strong>Total students at risk across all your courses: {total_at_risk}</strong></p>
        <hr>
        <p><small>{settings.APP_NAME} System Notification</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_admin_welcome_email(to_email: str, admin_name: str, institution_name: str, generated_password: str, login_url: str) -> None:
    subject = f"Welcome to {institution_name} — Your Admin Account"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>Welcome to {institution_name}</h2>
        <p>Hi {admin_name},</p>
        <p>Your administrator account has been successfully created.</p>
        <p><strong>Your login email:</strong> {to_email}</p>
        <p><strong>Your temporary password:</strong> {generated_password}</p>
        <p>Please log in and change your password immediately.</p>
        <a href="{login_url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Login to Your Dashboard</a>
        <hr>
        <p><small>{settings.APP_NAME} System Notification</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_lecturer_attendance_warning_email(
    to_email: str,
    lecturer_name: str,
    student_name: str,
    student_id: str,
    course_title: str,
    course_code: str,
    current_pct: float,
    threshold_pct: int
) -> None:
    subject = f"Student Below Attendance Threshold — {course_code}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Hi {lecturer_name},</p>
        <p>This is an automated notification that <strong>{student_name} ({student_id})</strong> has fallen below the attendance threshold for <strong>{course_code} - {course_title}</strong>.</p>
        <p>Current attendance: <span style="color: #dc3545; font-weight: bold;">{current_pct:.1f}%</span></p>
        <p>Required threshold: <strong>{threshold_pct}%</strong></p>
        <hr>
        <p><small>{settings.APP_NAME} System Notification</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)

async def send_new_student_enrolled_email(
    to_email: str,
    lecturer_name: str,
    student_name: str,
    student_id: str,
    course_title: str,
    course_code: str
) -> None:
    subject = f"New Student Enrolled in {course_code}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{settings.APP_NAME}</h2>
        <p>Hi {lecturer_name},</p>
        <p>A new student, <strong>{student_name} ({student_id})</strong>, has been enrolled in your course: <strong>{course_code} - {course_title}</strong>.</p>
        <p>They will appear in your next attendance session.</p>
        <hr>
        <p><small>{settings.APP_NAME} System Notification</small></p>
    </body>
    </html>
    """
    await _send_html_email(subject, to_email, html)
