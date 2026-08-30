from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from .database import Base


# ============================================================
# TIME HELPER
# ============================================================

def utcnow() -> datetime:
    """
    Return the current UTC time.
    """
    return datetime.now(timezone.utc)


# ============================================================
# USER
# ============================================================

class User(Base):
    """
    Customer login/profile information.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    account: Mapped["Account | None"] = relationship(
        "Account",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<User id={self.id} "
            f"email={self.email!r}>"
        )


# ============================================================
# BANK ACCOUNT
# ============================================================

class Account(Base):
    """
    Customer's demo banking account.

    Balance is stored as Decimal/Numeric rather than float so
    monetary values are not affected by floating-point errors.
    """

    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
        index=True,
    )

    account_number: Mapped[str] = mapped_column(
        String(24),
        unique=True,
        nullable=False,
        index=True,
    )

    balance: Mapped[Decimal] = mapped_column(
        Numeric(
            precision=18,
            scale=2,
        ),
        default=Decimal("0.00"),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="USD",
        nullable=False,
    )

    account_status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------------

    user: Mapped["User"] = relationship(
        "User",
        back_populates="account",
    )

    def __repr__(self) -> str:
        return (
            f"<Account id={self.id} "
            f"account_number={self.account_number!r} "
            f"balance={self.balance}>"
        )


# ============================================================
# TRANSACTION
# ============================================================

class Transaction(Base):
    """
    Internal demo transaction ledger.

    Examples:
        credit
        debit
    """

    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    transaction_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(
            precision=18,
            scale=2,
        ),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        default="Transaction",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="completed",
        nullable=False,
    )

    reference: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------------

    user: Mapped["User"] = relationship(
        "User",
        back_populates="transactions",
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction id={self.id} "
            f"type={self.transaction_type!r} "
            f"amount={self.amount}>"
        )


# ============================================================
# OTP
# ============================================================

class OTP(Base):
    """
    One-time verification code.

    The actual OTP code is never stored directly.
    Only its hash is stored.
    """

    __tablename__ = "otps"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    code_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    purpose: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<OTP id={self.id} "
            f"email={self.email!r} "
            f"purpose={self.purpose!r}>"
        )


# ============================================================
# DATABASE INDEXES
# ============================================================

Index(
    "ix_transactions_user_created",
    Transaction.user_id,
    Transaction.created_at,
)

Index(
    "ix_otps_email_purpose",
    OTP.email,
    OTP.purpose,
)
