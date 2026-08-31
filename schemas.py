from decimal import Decimal
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


# ============================================================
# BASE CONFIG
# ============================================================

class SchemaBase(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True
    )


# ============================================================
# REGISTER
# ============================================================

class RegisterIn(SchemaBase):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Customer's full name",
    )

    email: EmailStr = Field(
        ...,
        description="Customer email address",
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Customer password",
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:

        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Full name must contain at least 2 characters"
            )

        return value


# ============================================================
# LOGIN
# ============================================================

class LoginIn(SchemaBase):
    email: EmailStr = Field(
        ...,
        description="Customer email address",
    )

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Customer password",
    )


# ============================================================
# OTP VERIFICATION
# ============================================================

class VerifyOTPIn(SchemaBase):
    email: EmailStr = Field(
        ...,
        description="Email used during registration",
    )

    code: str = Field(
        ...,
        min_length=6,
        max_length=6,
        description="Six-digit verification code",
    )

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:

        value = value.strip()

        if not value.isdigit():
            raise ValueError(
                "Verification code must contain only numbers"
            )

        if len(value) != 6:
            raise ValueError(
                "Verification code must contain exactly 6 digits"
            )

        return value


# ============================================================
# TRANSFER
# ============================================================

class TransferIn(SchemaBase):
    recipient_account: str = Field(
        ...,
        min_length=4,
        max_length=24,
        description="Recipient account number",
    )

    amount: Decimal = Field(
        ...,
        gt=Decimal("0.00"),
        max_digits=18,
        decimal_places=2,
        description="Transfer amount",
    )

    description: str = Field(
        default="Transfer",
        min_length=1,
        max_length=200,
        description="Transfer description",
    )

    @field_validator("recipient_account")
    @classmethod
    def validate_recipient_account(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Recipient account is required"
            )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            return "Transfer"

        return value


# ============================================================
# LOGIN RESPONSE
# ============================================================

class TokenResponse(SchemaBase):
    access_token: str
    token_type: str = "bearer"


# ============================================================
# BASIC MESSAGE RESPONSE
# ============================================================

class MessageResponse(SchemaBase):
    message: str


# ============================================================
# ACCOUNT RESPONSE
# ============================================================

class AccountResponse(SchemaBase):
    id: int
    account_number: str
    balance: Decimal
    currency: str
    account_status: str


# ============================================================
# USER RESPONSE
# ============================================================

class UserResponse(SchemaBase):
    id: int
    full_name: str
    email: EmailStr
    verified: bool
    created_at: str


# ============================================================
# CURRENT USER / ACCOUNT RESPONSE
# ============================================================

class MeResponse(SchemaBase):
    id: int
    full_name: str
    email: EmailStr
    account_number: str
    balance: Decimal
    verified: bool
    created_at: str


# ============================================================
# TRANSACTION RESPONSE
# ============================================================

class TransactionResponse(SchemaBase):
    id: int
    type: str
    amount: Decimal
    description: str
    status: str
    created_at: str


# ============================================================
# ADMIN USER RESPONSE
# ============================================================

class AdminUserResponse(SchemaBase):
    id: int
    name: str
    email: EmailStr
    verified: bool
    account: Optional[str] = None
    balance: Decimal = Decimal("0.00")


# ============================================================
# TRANSFER RESPONSE
# ============================================================

class TransferResponse(SchemaBase):
    message: str
    amount: Decimal
    status: str
