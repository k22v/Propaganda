import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)
USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


async def send_email(
    to: List[str],
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("Email credentials not configured. Skipping email send.")
        return False
    
    if not to:
        return False
    
    try:
        import aiosmtplib
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = FROM_EMAIL
        message["To"] = ", ".join(to)
        
        if text_content:
            message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=USE_TLS,
        )
        
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def get_enrollment_email_template(username: str, course_name: str, course_url: str) -> tuple:
    subject = f"Вы записаны на курс: {course_name}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
            .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Добро пожаловать, {username}!</h1>
            </div>
            <div class="content">
                <p>Вы успешно записаны на курс <strong>{course_name}</strong>.</p>
                <p>Желаем вам успешного обучения!</p>
                <a href="{course_url}" class="button">Перейти к курсу</a>
            </div>
            <div class="footer">
                <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Добро пожаловать, {username}!
    
    Вы успешно записаны на курс {course_name}.
    
    Желаем вам успешного обучения!
    
    Перейти к курсу: {course_url}
    """
    
    return subject, html, text


def get_course_update_email_template(username: str, course_name: str, update_info: str) -> tuple:
    subject = f"Обновление курса: {course_name}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
            .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Обновление курса</h1>
            </div>
            <div class="content">
                <p>Привет, {username}!</p>
                <p>Курс <strong>{course_name}</strong> был обновлён:</p>
                <p>{update_info}</p>
            </div>
            <div class="footer">
                <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Привет, {username}!
    
    Курс {course_name} был обновлён:
    {update_info}
    """
    
    return subject, html, text


def get_quiz_result_email_template(username: str, quiz_name: str, score: int, passed: bool) -> tuple:
    status = "Пройден" if passed else "Не пройден"
    subject = f"Результаты теста: {quiz_name}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
            .score {{ font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }}
            .passed {{ color: #10b981; }}
            .failed {{ color: #ef4444; }}
            .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Результаты теста</h1>
            </div>
            <div class="content">
                <p>Привет, {username}!</p>
                <p>Тест: <strong>{quiz_name}</strong></p>
                <div class="score {'passed' if passed else 'failed'}">{score}%</div>
                <p>Статус: <strong>{status}</strong></p>
                {'<p>Отличная работа! Вы успешно прошли тест.</p>' if passed else '<p>Попробуйте ещё раз, чтобы улучшить результат.</p>'}
            </div>
            <div class="footer">
                <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Привет, {username}!
    
    Тест: {quiz_name}
    Результат: {score}%
    Статус: {status}
    
    {'Отличная работа! Вы успешно прошли тест.' if passed else 'Попробуйте ещё раз, чтобы улучшить результат.'}
    """
    
    return subject, html, text
