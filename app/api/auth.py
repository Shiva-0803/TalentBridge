import random
import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.email import send_otp_email, send_password_reset_email
from app.models.domain import User, CandidateProfile, OTPRecord
from app.schemas.pydantic_schemas import (
    SendOTPRequest, VerifyOTPRequest, AdminLoginRequest,
    UserRegister, UserLogin, Token, UserResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
        )
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to System Admin only",
        )
    return current_user

# -------------------------------------------------------------
# CANDIDATE PASSWORDLESS DYNAMIC OTP AUTHENTICATION
# -------------------------------------------------------------

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest, db: Session = Depends(get_db)):
    """
    Generates a 6-digit real-time dynamic OTP with 5-minute expiry.
    Sends via SMTP if configured, or logs safely.
    """
    email = request.email.lower().strip()
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

    # Deactivate previous unverified OTPs for this email
    db.query(OTPRecord).filter(OTPRecord.email == email, OTPRecord.is_verified == False).delete()

    otp_entry = OTPRecord(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(otp_entry)
    db.commit()

    # Check if existing candidate
    user = db.query(User).filter(User.email == email).first()
    is_existing = user is not None

    # Send email and check delivery status
    success, msg = send_otp_email(email, otp_code)
    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"{msg}. Please check your email address or try again."
        )

    return {
        "success": True,
        "message": f"Verification code sent to {email}",
        "email": email,
        "is_existing": is_existing
    }

@router.post("/verify-otp", response_model=Token)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verifies 6-digit OTP code and logs in/registers the candidate automatically.
    """
    email = request.email.lower().strip()
    otp_code = request.otp_code.strip()

    otp_record = db.query(OTPRecord).filter(
        OTPRecord.email == email,
        OTPRecord.otp_code == otp_code,
        OTPRecord.is_verified == False
    ).order_by(OTPRecord.id.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP verification code. Please check and try again.")

    if datetime.datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

    # Mark OTP as verified
    otp_record.is_verified = True
    db.commit()

    # Retrieve or create candidate user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        if not request.first_name or not request.first_name.strip():
            raise HTTPException(status_code=400, detail="First Name is mandatory for new candidate registration.")
        if not request.mobile or not request.mobile.strip():
            raise HTTPException(status_code=400, detail="Mobile Number is mandatory for new candidate registration.")

        fname = request.first_name.strip()
        lname = request.last_name.strip() if request.last_name else ""
        mob = request.mobile.strip()
        
        user = User(
            email=email,
            password_hash=get_password_hash("OTPVerifiedCandidate123"),
            first_name=fname,
            last_name=lname,
            role="candidate"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = CandidateProfile(user_id=user.id, mobile=mob)
        db.add(profile)
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    }

# -------------------------------------------------------------
# SYSTEM ADMIN STATIC CREDENTIAL AUTHENTICATION
# -------------------------------------------------------------

@router.post("/admin-login", response_model=Token)
@router.post("/admin/login", response_model=Token)
def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip(), User.role == "admin").first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid admin email or password")

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    }

# -------------------------------------------------------------
# LEGACY & CURRENT USER ROUTES
# -------------------------------------------------------------

# -------------------------------------------------------------
# CANDIDATE & USER AUTHENTICATION (EMAIL + PASSWORD)
# -------------------------------------------------------------

@router.post("/register", response_model=Token)
@router.post("/candidate/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    email_clean = user_data.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email address already exists. Please log in.")

    hashed_pw = get_password_hash(user_data.password)
    user = User(
        email=email_clean,
        password_hash=hashed_pw,
        first_name=user_data.first_name.strip(),
        last_name=user_data.last_name.strip() if user_data.last_name else "",
        role=user_data.role or "candidate"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == "candidate":
        profile = CandidateProfile(
            user_id=user.id,
            mobile=user_data.mobile.strip() if user_data.mobile else None
        )
        db.add(profile)
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    }

@router.post("/login", response_model=Token)
@router.post("/candidate/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    email_clean = user_data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email address or password. Please try again.")

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "profile": {
            "mobile": profile.mobile if profile else None,
            "gender": profile.gender if profile else None,
            "dob": profile.dob if profile else None,
            "current_location": profile.current_location if profile else None,
            "current_company": profile.current_company if profile else None,
            "notice_period": profile.notice_period if profile else None,
            "current_address": profile.current_address if profile else None,
            "profile_photo_url": profile.profile_photo_url if profile else None,
        } if profile else None
    }

class BasicProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    current_location: Optional[str] = None
    current_company: Optional[str] = None
    notice_period: Optional[str] = None
    current_address: Optional[str] = None

@router.put("/me")
@router.put("/profile")
def update_my_profile(
    data: BasicProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.first_name:
        current_user.first_name = data.first_name.strip()
    if data.last_name is not None:
        current_user.last_name = data.last_name.strip()
    db.commit()

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)

    if data.mobile is not None:
        profile.mobile = data.mobile.strip()
    if data.gender is not None:
        profile.gender = data.gender.strip()
    if data.dob is not None:
        profile.dob = data.dob.strip()
    if data.current_location is not None:
        profile.current_location = data.current_location.strip()
    if data.current_company is not None:
        profile.current_company = data.current_company.strip()
    if data.notice_period is not None:
        profile.notice_period = data.notice_period.strip()
    if data.current_address is not None:
        profile.current_address = data.current_address.strip()

    db.commit()
    return {"message": "Profile updated successfully"}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = request.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No registered account found with this email address."
        )

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    db.query(OTPRecord).filter(OTPRecord.email == email, OTPRecord.is_verified == False).delete()
    otp_entry = OTPRecord(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(otp_entry)
    db.commit()

    try:
        send_password_reset_email(email, otp_code)
    except Exception as e:
        print(f"[RESET EMAIL NOTICE] SMTP delivery attempted: {e}")

    return {
        "success": True,
        "message": f"Verification code generated for {email}",
        "otp_hint": otp_code
    }

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = request.email.lower().strip()
    otp_code = request.otp_code.strip()
    new_password = request.new_password.strip()

    if not new_password or len(new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    otp_record = db.query(OTPRecord).filter(
        OTPRecord.email == email,
        OTPRecord.otp_code == otp_code,
        OTPRecord.is_verified == False
    ).order_by(OTPRecord.id.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid reset code. Please check and try again.")

    if datetime.datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    otp_record.is_verified = True
    user.password_hash = get_password_hash(new_password)
    db.commit()

    return {"success": True, "message": "Password updated successfully! You can now sign in with your new password."}

import os as _os

@router.get("/test-email")
def test_email_delivery():
    """Debug endpoint: tests email delivery and returns the exact result/error."""
    from app.core.email import send_via_http_api, SMTP_USERNAME, SMTP_PASSWORD, get_http_api_key
    key_name, api_key = get_http_api_key()
    env_vars = {
        "RESEND_API_KEY": bool(_os.getenv("RESEND_API_KEY")),
        "BREVO_API_KEY": bool(_os.getenv("BREVO_API_KEY")),
        "SMTP_USERNAME": SMTP_USERNAME,
        "key_detected": key_name,
        "key_prefix": api_key[:8] + "..." if api_key else None
    }
    success, msg = send_via_http_api(
        to_email=SMTP_USERNAME or "test@example.com",
        subject="TalentBridge Email Test",
        body_text="This is a test email from TalentBridge to verify email delivery is working correctly."
    )
    return {
        "env": env_vars,
        "email_result": {"success": success, "message": msg}
    }
