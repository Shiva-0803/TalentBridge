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

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "banglore2122@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "ihetqztrispkxwip")

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

    if SMTP_USERNAME and SMTP_PASSWORD:
        msg = MIMEMultipart()
        msg['From'] = f"TalentBridge <{SMTP_USERNAME}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Try Port 587 TLS first; fallback to Port 465 SSL if TLS fails or times out
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
            return False, f"Email delivery error: {err_str}"
    else:
        print(f"[LOG ONLY] OTP for {to_email}: {otp_code}")
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
