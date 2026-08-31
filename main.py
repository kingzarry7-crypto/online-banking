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

from database import Base, engine, get_db, settings
from models import User, Account, Transaction, OTP
from schemas import RegisterIn, LoginIn, VerifyOTPIn, TransferIn
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    make_otp,
    hash_otp,
)
from emailer import send_otp_email


# ============================================================
# PATHS
# ============================================================

# All project files are in the repository root.
#
# /app/
# ├── main.py
# ├── database.py
# ├── models.py
# ├── schemas.py
# ├── security.py
# ├── emailer.py
# ├── index.html
# ├── app.js
# └── style.css

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Online Banking API",
    description="Original fictional online banking demonstration API",
    version="1.0.0",
)


# ============================================================
# STATIC FRONTEND
# ============================================================

# The frontend files are stored in the repository root.
#
# Browser:
# /static/style.css
# /static/app.js
#
# This works with:
# index.html
# app.js
# style.css

app.mount(
    "/static",
    StaticFiles(directory=str(FRONTEND_DIR)),
    name="static",
)


# ============================================================
# CORS
# ============================================================

# This is intentionally permissive for initial deployment.
#
# For a real production deployment, replace "*" with the
# actual frontend domain.

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
    """
    Create database tables if they do not already exist.
    """

    Base.metadata.create_all(bind=engine)


# ============================================================
# HOME PAGE
# ============================================================

@app.get("/", include_in_schema=False)
def home():
    """
    Serve the banking frontend.
    """

    index_file = FRONTEND_DIR / "index.html"

    if not index_file.exists():
        raise HTTPException(
            status_code=500,
            detail="index.html was not found",
        )

    return FileResponse(str(index_file))


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
    """
    Generate a unique 12-digit demo account number.
    """

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

        decoded_user_id = decode_token(token)

        user_id = int(decoded_user_id)

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

    # --------------------------------------------------------
    # OTP
    # --------------------------------------------------------

    code = make_otp()

    otp = OTP(
        email=email,
        code_hash=hash_otp(code),
        purpose="verify",
        expires_at=(
            datetime.now(timezone.utc)
            + timedelta(
                minutes=10
            )
        ),
        used=False,
    )

    db.add(otp)

    db.commit()

    # --------------------------------------------------------
    # EMAIL
    # --------------------------------------------------------

    email_sent = True

    try:

        send_otp_email(
            email,
            code,
        )

    except Exception as exc:

        email_sent = False

        print(
            f"OTP email error: {exc}"
        )

    response = {
        "message": (
            "Registration created. "
            "Check your email for the verification code."
        ),
        "email_sent": email_sent,
    }

    return response


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
        .order_by(
            desc(OTP.id)
        )
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

    supplied_code = str(
        data.code
    ).strip()

    if otp.code_hash != hash_otp(
        supplied_code
    ):

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
# CURRENT USER / ACCOUNT
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

    created_at = user.created_at

    if created_at is None:
        created_at_value = None
    else:
        created_at_value = created_at.isoformat()

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "account_number": account.account_number,
        "balance": str(account.balance),
        "verified": user.is_verified,
        "created_at": created_at_value,
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
            "created_at": (
                transaction.created_at.isoformat()
                if transaction.created_at
                else None
            ),
        }

        for transaction in transactions

    ]


# ============================================================
# DEMO INTERNAL TRANSFER
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

    amount = Decimal(
        str(data.amount)
    )

    if amount <= Decimal("0"):

        raise HTTPException(
            status_code=400,
            detail="Transfer amount must be greater than zero",
        )

    # --------------------------------------------------------
    # Sender
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Recipient
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Balance
    # --------------------------------------------------------

    if sender.balance < amount:

        raise HTTPException(
            status_code=400,
            detail="Insufficient balance",
        )

    # --------------------------------------------------------
    # DEMO LEDGER
    # --------------------------------------------------------
    #
    # This modifies balances inside this application's
    # PostgreSQL database only.
    #
    # It does NOT send real money through a bank,
    # payment processor, or financial institution.
    # --------------------------------------------------------

    sender.balance -= amount

    recipient.balance += amount

    description = (
        data.description.strip()
        if data.description
        else "Transfer"
    )

    debit_transaction = Transaction(
        user_id=user.id,
        transaction_type="debit",
        amount=amount,
        description=description,
        status="completed",
    )

    credit_transaction = Transaction(
        user_id=recipient.user_id,
        transaction_type="credit",
        amount=amount,
        description=(
            f"Transfer from {user.full_name}"
        ),
        status="completed",
    )

    db.add(
        debit_transaction
    )

    db.add(
        credit_transaction
    )

    db.commit()

    return {
        "message": "Transfer completed",
        "amount": str(amount),
        "status": "completed",
    }


# ============================================================
# ADMIN AUTHENTICATION
# ============================================================

def verify_admin(
    x_admin_email: str | None = Header(
        default=None
    ),
    x_admin_password: str | None = Header(
        default=None
    ),
):

    configured_email = getattr(
        settings,
        "ADMIN_EMAIL",
        None,
    )

    configured_password = getattr(
        settings,
        "ADMIN_PASSWORD",
        None,
    )

    if not configured_email:
        raise HTTPException(
            status_code=500,
            detail="ADMIN_EMAIL is not configured",
        )

    if not configured_password:
        raise HTTPException(
            status_code=500,
            detail="ADMIN_PASSWORD is not configured",
        )

    if (
        not x_admin_email
        or not x_admin_password
    ):

        raise HTTPException(
            status_code=401,
            detail="Admin authentication required",
        )

    if (
        x_admin_email.strip().lower()
        != str(configured_email).strip().lower()
        or x_admin_password
        != str(configured_password)
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
        .order_by(
            desc(User.id)
        )
    ).all()

    result = []

    for user in users:

        account = db.scalar(
            select(Account).where(
                Account.user_id == user.id
            )
        )

        result.append(
            {
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "verified": user.is_verified,

                "account": (
                    account.account_number
                    if account
                    else None
                ),

                "balance": (
                    str(account.balance)
                    if account
                    else "0.00"
                ),
            }
        )

    return result


# ============================================================
# ADMIN: ACCOUNT SUMMARY
# ============================================================

@app.get("/api/admin/summary")
def admin_summary(
    _: None = Depends(verify_admin),
    db: Session = Depends(get_db),
):

    users_count = len(
        db.scalars(
            select(User)
        ).all()
    )

    accounts = db.scalars(
        select(Account)
    ).all()

    transactions_count = len(
        db.scalars(
            select(Transaction)
        ).all()
    )

    total_balance = sum(
        (
            Decimal(
                str(account.balance)
            )
            for account in accounts
        ),
        Decimal("0.00"),
    )

    return {
        "users": users_count,
        "accounts": len(accounts),
        "transactions": transactions_count,
        "total_demo_balance": str(
            total_balance
        ),
    }


# ============================================================
# ERROR HANDLER FOR MISSING FRONTEND
# ============================================================

@app.get(
    "/{path:path}",
    include_in_schema=False,
)
def frontend_fallback(path: str):

    # Don't intercept API routes.
    if path.startswith("api/"):
        raise HTTPException(
            status_code=404,
            detail="API endpoint not found",
        )

    requested_file = FRONTEND_DIR / path

    # Prevent path traversal outside the project directory.
    try:
        requested_file.resolve().relative_to(
            FRONTEND_DIR.resolve()
        )
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    if requested_file.is_file():

        return FileResponse(
            str(requested_file)
        )

    # For browser navigation, return index.html.
    index_file = FRONTEND_DIR / "index.html"

    if index_file.exists():

        return FileResponse(
            str(index_file)
        )

    raise HTTPException(
        status_code=404,
        detail="File not found",
    )


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
