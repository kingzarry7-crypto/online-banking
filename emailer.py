# ============================================================
# ONLINE BANKING - EMAIL SERVICE
# ============================================================

import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from .database import settings


# ============================================================
# EMAIL CONFIGURATION
# ============================================================

def smtp_is_configured() -> bool:
    """
    Check whether SMTP settings have been configured.
    """

    return all(
        [
            settings.SMTP_HOST,
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        ]
    )


# ============================================================
# BUILD OTP EMAIL
# ============================================================

def build_otp_email(
    code: str,
) -> tuple[str, str]:
    """
    Build the plain-text and HTML versions of
    the verification email.
    """

    subject = "Your Online Banking verification code"

    text = f"""
Online Banking

Your verification code is:

{code}

This code expires in 10 minutes.

If you did not request this code, you can safely
ignore this email.

Please do not share your verification code with anyone.
""".strip()

    html = f"""
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>Online Banking Verification</title>

</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial,Helvetica,sans-serif;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="padding:40px 15px;"
>

<tr>

<td align="center">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
        max-width:520px;
        background:#ffffff;
        border-radius:20px;
        overflow:hidden;
        border:1px solid #e4e9f2;
    "
>

<tr>

<td style="
    background:#102c4c;
    padding:28px;
    text-align:center;
    color:#ffffff;
">

<div style="
    display:inline-block;
    width:52px;
    height:52px;
    line-height:52px;
    border-radius:14px;
    background:#ffffff;
    color:#2d6cdf;
    font-size:18px;
    font-weight:bold;
">

OB

</div>

<h1 style="
    margin:15px 0 5px;
    font-size:22px;
">

ONLINE BANKING

</h1>

<p style="
    margin:0;
    opacity:.75;
    font-size:13px;
">

Secure digital banking

</p>

</td>

</tr>

<tr>

<td style="padding:35px 30px;">

<h2 style="
    margin:0 0 12px;
    color:#17233b;
    font-size:24px;
">

Verify your email

</h2>

<p style="
    color:#71809c;
    line-height:1.6;
    font-size:15px;
">

Use the verification code below to complete
your Online Banking registration.

</p>

<div style="
    margin:28px 0;
    padding:20px;
    text-align:center;
    background:#f4f7fb;
    border-radius:14px;
">

<span style="
    font-size:34px;
    font-weight:bold;
    letter-spacing:8px;
    color:#2d6cdf;
">

{code}

</span>

</div>

<p style="
    color:#71809c;
    font-size:14px;
    line-height:1.6;
">

This verification code expires in
<strong>10 minutes</strong>.

</p>

<p style="
    color:#71809c;
    font-size:14px;
    line-height:1.6;
">

Never share this code with another person.
Our support team will never ask you for your
verification code.

</p>

</td>

</tr>

<tr>

<td style="
    background:#f8fafd;
    padding:20px 30px;
    text-align:center;
    color:#8a96aa;
    font-size:12px;
">

If you did not request this code, you can
safely ignore this email.

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
"""

    return subject, text, html


# ============================================================
# SEND SMTP EMAIL
# ============================================================

def send_email_smtp(
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> bool:
    """
    Send an email through the configured SMTP server.
    """

    if not smtp_is_configured():

        raise RuntimeError(
            "SMTP is not configured"
        )

    message = EmailMessage()

    message["Subject"] = subject

    message["From"] = formataddr(
        (
            "Online Banking",
            settings.SMTP_FROM
            or settings.SMTP_USERNAME,
        )
    )

    message["To"] = recipient

    message.set_content(
        text_body
    )

    message.add_alternative(
        html_body,
        subtype="html",
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=30,
    ) as smtp:

        smtp.ehlo()

        smtp.starttls()

        smtp.ehlo()

        smtp.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )

        smtp.send_message(
            message
        )

    return True


# ============================================================
# SEND OTP EMAIL
# ============================================================

def send_otp_email(
    recipient: str,
    code: str,
) -> bool:
    """
    Send the registration verification OTP.

    During local development, if SMTP is not configured,
    the OTP is printed to the server console.

    In production, configure SMTP so the OTP is actually
    delivered to the customer's email.
    """

    subject, text_body, html_body = (
        build_otp_email(code)
    )

    # --------------------------------------------------------
    # DEVELOPMENT MODE
    # --------------------------------------------------------

    if not smtp_is_configured():

        print()
        print("=" * 60)
        print("📧 DEVELOPMENT OTP")
        print("=" * 60)
        print(f"Recipient: {recipient}")
        print(f"OTP CODE:  {code}")
        print("Expires:   10 minutes")
        print("=" * 60)
        print()

        return True

    # --------------------------------------------------------
    # PRODUCTION SMTP
    # --------------------------------------------------------

    return send_email_smtp(
        recipient=recipient,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )


# ============================================================
# TEST EMAIL
# ============================================================

def send_test_email(
    recipient: str,
) -> bool:
    """
    Send a simple test email.

    Useful when checking SMTP configuration.
    """

    subject = "Online Banking email test"

    text_body = """
Online Banking

This is a test email.

Your email configuration is working.
""".strip()

    html_body = """
<!DOCTYPE html>

<html>

<body style="
    font-family:Arial,sans-serif;
    background:#f4f7fb;
    padding:40px;
">

<div style="
    max-width:500px;
    margin:auto;
    background:white;
    padding:30px;
    border-radius:16px;
">

<h2>Online Banking</h2>

<p>Your email configuration is working.</p>

</div>

</body>

</html>
"""

    return send_email_smtp(
        recipient=recipient,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )
