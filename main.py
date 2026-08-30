from datetime import datetime, timedelta, timezone
from decimal import Decimal
import secrets
from pathlib import Path

from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from .database import Base, engine, get_db, settings
from .models import User, Account, Transaction, OTP
from .schemas import RegisterIn, LoginIn, VerifyOTPIn, TransferIn
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    make_otp,
    hash_otp,
)
from .emailer import send_otp_email


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Online Banking API",
    description="Original online banking application",
    version="1.0.0",
)


# ============================================================
# FRONTEND STATIC FILES
# ============================================================

app.mount(
    "/static",
    StaticFiles(directory=str(FRONTEND_DIR)),
    name="static",
)


# ============================================================
# CORS
# ============================================================
# "*" is convenient while developing.
# In production, replace this with your real domain.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE STARTUP
# ============================================================

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


# ============================================================
# HOME
# ============================================================

@app.get("/", include_in_schema=False)
def home():
    return FileResponse(
        str(FRONTEND_DIR / "index.html")
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "online-banking-api",
        "version": "1.0.0",
    }


# ============================================================
# ACCOUNT NUMBER GENERATOR
# ============================================================

def generate_account_number(db: Session) -> str:

    while True:

        number = "20" + "".join(
            str(secrets.randbelow(10))
            for _ in range(10)
        )

        existing = db.scalar(
            select(Account).where(
                Account.account_number == number
            )
        )

        if not existing:
            return number


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    if not authorization.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization[7:].strip()

    if not token:

        raise HTTPException(
            status_code=401,
            detail="Missing access token",
        )

    try:

        user_id = int(
            decode_token(token)
        )

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session",
        )

    user = db.get(User, user_id)

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user


# ============================================================
# REGISTER
# ============================================================

@app.post("/api/auth/register")
def register(
    data: RegisterIn,
    db: Session = Depends(get_db),
):

    email = str(data.email).lower().strip()

    existing_user = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(
            data.password
        ),
        is_verified=False,
    )

    db.add(user)

    db.flush()

    account = Account(
        user_id=user.id,
        account_number=generate_account_number(db),
        balance=Decimal("0.00"),
    )

    db.add(account)

    # Generate OTP
    code = make_otp()

    otp = OTP(
        email=email,
        code_hash=hash_otp(code),
        purpose="verify",
        expires_at=(
            datetime.now(timezone.utc)
            + timedelta(minutes=10)
        ),
        used=False,
    )

    db.add(otp)

    db.commit()

    # Send verification email
    try:

        send_otp_email(
            email,
            code,
        )

    except Exception as exc:

        print(
            f"OTP email error: {exc}"
        )

    return {
        "message": (
            "Registration created. "
            "Check your email for the verification code."
        )
    }


# ============================================================
# VERIFY EMAIL
# ============================================================

@app.post("/api/auth/verify")
def verify_email(
    data: VerifyOTPIn,
    db: Session = Depends(get_db),
):

    email = str(data.email).lower().strip()

    otp = db.scalar(
        select(OTP)
        .where(
            OTP.email == email,
            OTP.purpose == "verify",
            OTP.used == False,
        )
        .order_by(desc(OTP.id))
    )

    if not otp:

        raise HTTPException(
            status_code=400,
            detail="Verification code not found",
        )

    now = datetime.now(timezone.utc)

    expires_at = otp.expires_at

    if expires_at.tzinfo is None:

        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if expires_at < now:

        raise HTTPException(
            status_code=400,
            detail="Verification code has expired",
        )

    if otp.code_hash != hash_otp(data.code):

        raise HTTPException(
            status_code=400,
            detail="Invalid verification code",
        )

    user = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    otp.used = True

    user.is_verified = True

    db.commit()

    return {
        "message": "Account verified successfully"
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(
    data: LoginIn,
    db: Session = Depends(get_db),
):

    email = str(data.email).lower().strip()

    user = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not user.is_verified:

        raise HTTPException(
            status_code=403,
            detail="Verify your email before signing in",
        )

    access_token = create_access_token(
        str(user.id)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# CURRENT ACCOUNT
# ============================================================

@app.get("/api/me")
def get_me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    account = db.scalar(
        select(Account).where(
            Account.user_id == user.id
        )
    )

    if not account:

        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "account_number": account.account_number,
        "balance": str(account.balance),
        "verified": user.is_verified,
        "created_at": user.created_at.isoformat(),
    }


# ============================================================
# TRANSACTION HISTORY
# ============================================================

@app.get("/api/transactions")
def get_transactions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    transactions = db.scalars(
        select(Transaction)
        .where(
            Transaction.user_id == user.id
        )
        .order_by(
            desc(Transaction.created_at)
        )
        .limit(50)
    ).all()

    return [

        {
            "id": transaction.id,
            "type": transaction.transaction_type,
            "amount": str(transaction.amount),
            "description": transaction.description,
            "status": transaction.status,
            "created_at": transaction.created_at.isoformat(),
        }

        for transaction in transactions

    ]


# ============================================================
# INTERNAL DEMO TRANSFER
# ============================================================

@app.post("/api/transfers")
def transfer(
    data: TransferIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    recipient_account_number = (
        data.recipient_account.strip()
    )

    if not recipient_account_number:

        raise HTTPException(
            status_code=400,
            detail="Recipient account is required",
        )

    if data.amount <= Decimal("0"):

        raise HTTPException(
            status_code=400,
            detail="Transfer amount must be greater than zero",
        )

    sender = db.scalar(
        select(Account).where(
            Account.user_id == user.id
        )
    )

    if not sender:

        raise HTTPException(
            status_code=404,
            detail="Sender account not found",
        )

    recipient = db.scalar(
        select(Account).where(
            Account.account_number
            == recipient_account_number
        )
    )

    if not recipient:

        raise HTTPException(
            status_code=404,
            detail="Recipient account not found",
        )

    if recipient.id == sender.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot transfer to your own account",
        )

    if sender.balance < data.amount:

        raise HTTPException(
            status_code=400,
            detail="Insufficient balance",
        )

    # ========================================================
    # DEMO LEDGER
    # ========================================================
    # This only changes balances in this application's
    # PostgreSQL database.
    #
    # It does NOT move real money through a bank/payment rail.
    # ========================================================

    sender.balance -= data.amount

    recipient.balance += data.amount

    debit_transaction = Transaction(
        user_id=user.id,
        transaction_type="debit",
        amount=data.amount,
        description=(
            data.description.strip()
            or "Transfer"
        ),
        status="completed",
    )

    credit_transaction = Transaction(
        user_id=recipient.user_id,
        transaction_type="credit",
        amount=data.amount,
        description=(
            f"Transfer from {user.full_name}"
        ),
        status="completed",
    )

    db.add(debit_transaction)

    db.add(credit_transaction)

    db.commit()

    return {
        "message": "Transfer completed",
        "amount": str(data.amount),
        "status": "completed",
    }


# ============================================================
# ADMIN AUTHENTICATION
# ============================================================

def verify_admin(
    x_admin_email: str | None = Header(default=None),
    x_admin_password: str | None = Header(default=None),
):

    if (
        not x_admin_email
        or not x_admin_password
        or x_admin_email
        != settings.ADMIN_EMAIL
        or x_admin_password
        != settings.ADMIN_PASSWORD
    ):

        raise HTTPException(
            status_code=401,
            detail="Admin authentication failed",
        )


# ============================================================
# ADMIN: LIST USERS
# ============================================================

@app.get("/api/admin/users")
def admin_users(
    _: None = Depends(verify_admin),
    db: Session = Depends(get_db),
):

    users = db.scalars(
        select(User)
        .order_by(desc(User.id))
    ).all()

    return [

        {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "verified": user.is_verified,

            "account": (
                user.account.account_number
                if user.account
                else None
            ),

            "balance": (
                str(user.account.balance)
                if user.account
                else "0.00"
            ),
        }

        for user in users

    ]


# ============================================================
# RUN WITH PYTHON
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
