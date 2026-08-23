import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import json
import urllib.request
import urllib.error

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "banglore2122@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "ihetqztrispkxwip")

def get_http_api_key():
    # Search all common environment variable names
    aliases = [
        "RESEND_API_KEY", "RESEND_KEY", "RESEND_TOKEN", "RESEND",
        "BREVO_API_KEY", "BREVO_KEY", "BREVO_TOKEN", "BREVO",
        "SENDGRID_API_KEY", "SENDGRID_KEY", "SENDGRID_TOKEN", "SENDGRID",
        "EMAIL_API_KEY", "HTTP_EMAIL_KEY", "API_KEY"
    ]
    for env_name in aliases:
        val = os.getenv(env_name, "").strip()
        if val:
            return env_name, val
    # Check all environment variables for known key prefixes
    for k, v in os.environ.items():
        v_clean = v.strip()
        if v_clean.startswith("re_") or v_clean.startswith("xkeysib-") or v_clean.startswith("SG."):
            return k, v_clean
    return None, None

def send_via_http_api(to_email: str, subject: str, body_text: str):
    """
    Sends transactional email over HTTPS (Port 443) using HTTP REST APIs.
    Bypasses cloud provider raw SMTP socket blocks (such as Render Errno 101).
    """
    key_name, api_key = get_http_api_key()
    if not api_key:
        return False, "No HTTP API key found in environment variables"

    print(f"[HTTP API DETECTED] Found environment key '{key_name}' (prefix: {api_key[:6]}...)")

    # 1. Resend API (key starts with 're_' or variable name contains RESEND)
    if api_key.startswith("re_") or "RESEND" in key_name.upper():
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": "TalentBridge <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "text": body_text
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req, timeout=10) as res:
                if res.status in [200, 201, 202]:
                    print(f"[HTTP API SUCCESS] Resend email delivered to {to_email}")
                    return True, "Email sent via Resend HTTPS API"
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode('utf-8')
            except Exception:
                err_body = str(e)
            err_msg = f"Resend HTTP {e.code}: {err_body}"
            print(f"[HTTP API ERROR] {err_msg}")
            return False, err_msg
        except Exception as e:
            err_msg = f"Resend connection error: {e}"
            print(f"[HTTP API WARN] {err_msg}")
            return False, err_msg

    # 2. Brevo (Sendinblue) API (key starts with 'xkeysib-' or variable name contains BREVO)
    if api_key.startswith("xkeysib-") or "BREVO" in key_name.upper():
        try:
            url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": api_key
            }
            payload = {
                "sender": {"name": "TalentBridge Careers", "email": SMTP_USERNAME or "careers@talentbridge.com"},
                "to": [{"email": to_email}],
                "subject": subject,
                "textContent": body_text
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req, timeout=10) as res:
                if res.status in [200, 201, 202]:
                    print(f"[HTTP API SUCCESS] Brevo email delivered to {to_email}")
                    return True, "Email sent via Brevo HTTPS API"
        except Exception as e:
            print(f"[HTTP API WARN] Brevo API error: {e}")

    # 3. SendGrid API (key starts with 'SG.' or variable name contains SENDGRID)
    if api_key.startswith("SG.") or "SENDGRID" in key_name.upper():
        try:
            url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": SMTP_USERNAME or "careers@talentbridge.com", "name": "TalentBridge"},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body_text}]
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req, timeout=10) as res:
                if res.status in [200, 201, 202]:
                    print(f"[HTTP API SUCCESS] SendGrid email delivered to {to_email}")
                    return True, "Email sent via SendGrid HTTPS API"
        except Exception as e:
            print(f"[HTTP API WARN] SendGrid API error: {e}")

    return False, f"Configured API key in '{key_name}' failed to deliver email"


def send_otp_email(to_email: str, otp_code: str):
    subject = "Your TalentBridge Login Verification Code"
    body = f"""Hello,

Your 6-digit OTP verification code for TalentBridge Candidate Portal is:

        {otp_code}

This code will expire in 5 minutes.
If you did not request this, please ignore this email.

Best regards,
TalentBridge HR Team
"""

    # 1. Try HTTPS HTTP API first (Port 443 - never blocked by Render)
    http_success, http_msg = send_via_http_api(to_email, subject, body)
    if http_success:
        return True, http_msg

    # 2. Try Raw SMTP (Ports 587 / 465)
    if SMTP_USERNAME and SMTP_PASSWORD:
        msg = MIMEMultipart()
        msg['From'] = f"TalentBridge <{SMTP_USERNAME}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        try:
            try:
                server = smtplib.SMTP(SMTP_SERVER, 587, timeout=10)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[SMTP TLS SUCCESS] OTP email sent to {to_email}")
                return True, "Email sent"
            except Exception as tls_err:
                print(f"[SMTP TLS WARN] Port 587 failed ({tls_err}). Trying Port 465 SSL fallback...")
                server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[SMTP SSL SUCCESS] OTP email sent to {to_email}")
                return True, "Email sent via SSL"
        except Exception as e:
            err_str = str(e)
            print(f"[SMTP ERROR] {err_str}")
            if "Network is unreachable" in err_str or "101" in err_str or "111" in err_str:
                return False, "Render cloud platform blocks raw outbound SMTP ports (587/465). Please add BREVO_API_KEY or RESEND_API_KEY to Render Environment Variables for HTTPS email delivery."
            return False, f"Email delivery error: {err_str}"
    else:
        print(f"[LOG ONLY] OTP for {to_email}: {otp_code}")
        return True, "Logged"


def send_password_reset_email(to_email: str, otp_code: str):
    subject = "Your TalentBridge Password Reset Code"
    body = f"""Hello,

Your 6-digit verification code to reset your TalentBridge account password is:

        {otp_code}

This code will expire in 10 minutes.
If you did not request a password reset, please ignore this email or secure your account.

Best regards,
TalentBridge HR Team
"""

    # 1. Try HTTPS HTTP API first (Port 443 - never blocked by Render)
    http_success, http_msg = send_via_http_api(to_email, subject, body)
    if http_success:
        return True, http_msg

    # 2. Try Raw SMTP (Ports 587 / 465)
    if SMTP_USERNAME and SMTP_PASSWORD:
        msg = MIMEMultipart()
        msg['From'] = f"TalentBridge <{SMTP_USERNAME}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        try:
            try:
                server = smtplib.SMTP(SMTP_SERVER, 587, timeout=10)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[SMTP TLS SUCCESS] Password reset email sent to {to_email}")
                return True, "Email sent"
            except Exception as tls_err:
                print(f"[SMTP TLS WARN] Port 587 failed ({tls_err}). Trying Port 465 SSL fallback...")
                server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[SMTP SSL SUCCESS] Password reset email sent to {to_email}")
                return True, "Email sent via SSL"
        except Exception as e:
            err_str = str(e)
            print(f"[SMTP ERROR] {err_str}")
            return False, f"Email delivery error: {err_str}"
    else:
        print(f"[LOG ONLY] Reset OTP for {to_email}: {otp_code}")
        return True, "Logged"


def send_application_confirmation_email(
    to_email: str,
    candidate_name: str,
    application_code: str,
    job_title: str,
    department: str,
    location: str,
    requisition_id: str,
    submitted_at: str,
):
    """
    Sends a professional application confirmation email to the candidate
    immediately after they submit their job application.
    """
    subject = f"Application Received - {job_title} | TalentBridge"
    body = f"""Dear {candidate_name},

Thank you for applying to TalentBridge! We are pleased to confirm that your application has been received successfully.

---------------------------------------------------------
  APPLICATION CONFIRMATION DETAILS
---------------------------------------------------------

  Application ID   : {application_code}
  Position Applied : {job_title}
  Department       : {department}
  Location         : {location}
  Requisition ID   : {requisition_id}
  Submitted On     : {submitted_at}
  Status           : Under Review

---------------------------------------------------------

WHAT HAPPENS NEXT?

  1. Our recruitment team will review your application and resume.
  2. If your profile matches our requirements, a recruiter will
     reach out to schedule the next steps.
  3. You can track your application status anytime by logging
     into your TalentBridge Candidate Portal.

We appreciate your interest in joining our team and wish you
the very best in your application!

Warm regards,
TalentBridge Talent Acquisition Team
---------------------------------------------------------
This is an automated confirmation email. Please do not reply.
"""

    # 1. Try HTTPS HTTP API first
    http_success, http_msg = send_via_http_api(to_email, subject, body)
    if http_success:
        return True, http_msg

    # 2. Try Raw SMTP
    if SMTP_USERNAME and SMTP_PASSWORD:
        msg = MIMEMultipart()
        msg['From'] = f"TalentBridge Careers <{SMTP_USERNAME}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        try:
            try:
                server = smtplib.SMTP(SMTP_SERVER, 587, timeout=10)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[SMTP TLS SUCCESS] Confirmation email sent to {to_email}")
                return True, "Email sent"
            except Exception as tls_err:
                print(f"[SMTP TLS WARN] Port 587 failed ({tls_err}). Trying Port 465 SSL fallback...")
                server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[SMTP SSL SUCCESS] Confirmation email sent to {to_email}")
                return True, "Email sent via SSL"
        except Exception as e:
            print(f"[SMTP ERROR] Confirmation email failed: {str(e)}")
            return False, str(e)
    else:
        print(f"[LOG ONLY] Confirmation email would be sent to {to_email} for {application_code}")
        return True, "Logged"
