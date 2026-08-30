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

def send_via_brevo_api(to_email: str, subject: str, body_text: str):
    """
    Sends transactional email over HTTPS (Port 443) using Brevo (Sendinblue) v3 REST API.
    Bypasses cloud provider raw SMTP socket blocks (such as Render Errno 101).
    """
    api_key = (
        os.getenv("BREVO_API_KEY") or
        os.getenv("BREVO_KEY") or
        os.getenv("BREVO_TOKEN") or
        os.getenv("BREVO") or ""
    ).strip()

    if not api_key:
        for k, v in os.environ.items():
            if v.strip().startswith("xkeysib-"):
                api_key = v.strip()
                break

    if not api_key:
        print("[BREVO API NOTICE] BREVO_API_KEY is missing from environment variables.")
        return False, "BREVO_API_KEY not found in environment variables"

    sender_email = os.getenv("BREVO_SENDER_EMAIL", "").strip() or SMTP_USERNAME or "banglore2122@gmail.com"
    sender_name = os.getenv("BREVO_SENDER_NAME", "TalentBridge HR").strip()

    print(f"[BREVO DISPATCH] Sending real-time email to {to_email} via Brevo API (Key prefix: {api_key[:8]}...)...")

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key,
        "User-Agent": "TalentBridge/1.0 (Python)"
    }
    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": body_text
    }

    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req, timeout=12) as res:
            if res.status in [200, 201, 202]:
                resp_text = res.read().decode('utf-8')
                print(f"[BREVO SUCCESS] Real-time OTP email delivered to {to_email}. Response: {resp_text}")
                return True, f"Email delivered via Brevo HTTPS API: {resp_text}"
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode('utf-8')
        except Exception:
            err_body = str(e)
        err_msg = f"Brevo HTTP {e.code}: {err_body}"
        print(f"[BREVO ERROR] {err_msg}")
        return False, err_msg
    except Exception as e:
        err_msg = f"Brevo connection error: {e}"
        print(f"[BREVO WARN] {err_msg}")
        return False, err_msg

    return False, "Brevo API call failed"


def send_email_direct(to_email: str, subject: str, body_text: str):
    """
    Direct email dispatch using exclusively BREVO_API_KEY over HTTPS.
    Falls back to Gmail SMTP SSL (Port 465) if Brevo is not configured or fails.
    """
    # 1. Primary Strategy: Try Brevo HTTPS REST API (Port 443)
    brevo_success, brevo_msg = send_via_brevo_api(to_email, subject, body_text)
    if brevo_success:
        return True, brevo_msg

    # 2. Secondary Strategy: Try direct Gmail SMTP SSL on Port 465
    if SMTP_USERNAME and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg['From'] = f"TalentBridge <{SMTP_USERNAME}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body_text, 'plain'))

            server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=5)
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f"[SMTP SSL SUCCESS] Real-time email delivered to {to_email}")
            return True, "Email sent via SSL"
        except Exception as ssl_err:
            print(f"[SMTP SSL WARN] Port 465 SSL failed ({ssl_err})")

    return False, brevo_msg


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
    return send_email_direct(to_email, subject, body)


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
    return send_email_direct(to_email, subject, body)


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

    return send_email_direct(to_email, subject, body)
