from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User, CandidateProfile

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def register_user(db: Session, first_name: str, last_name: str, email: str, password: str, mobile: str = "", role: str = "candidate"):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return None, "Email is already registered. Please login."

    hashed_pw = get_password_hash(password)
    user = User(
        email=email,
        password_hash=hashed_pw,
        first_name=first_name,
        last_name=last_name,
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == "candidate":
        profile = CandidateProfile(
            user_id=user.id,
            mobile=mobile
        )
        db.add(profile)
        db.commit()

    return user, None

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        return None, "Invalid email or password"
    return user, None
