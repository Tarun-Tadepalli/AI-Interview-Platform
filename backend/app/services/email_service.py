import os
import httpx


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_password_reset_otp(receiver_email: str, otp: str):
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("BREVO_SENDER_EMAIL")
    sender_name = os.getenv(
        "BREVO_SENDER_NAME",
        "AI Interview Platform"
    )

    if not api_key or not sender_email:
        raise RuntimeError(
            "Brevo email configuration is missing."
        )

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": receiver_email
            }
        ],
        "subject": "Your AI Interview Platform password reset code",
        "htmlContent": f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 28px;
            color: #202436;
            border: 1px solid #e6e8ef;
            border-radius: 12px;
        ">
            <h2 style="color: #202436;">
                Password reset verification
            </h2>

            <p>Hello,</p>

            <p>
                We received a request to reset the password
                associated with your AI Interview Platform account.
            </p>

            <p>Your verification code is:</p>

            <div style="
                margin: 24px 0;
                padding: 18px;
                text-align: center;
                background: #f4f5f8;
                border-radius: 8px;
                font-size: 30px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #d52b3f;
            ">
                {otp}
            </div>

            <p>
                This code expires in <strong>5 minutes</strong>.
                You have a maximum of 3 attempts to enter it correctly.
            </p>

            <p>
                If you did not request a password reset, you can
                safely ignore this email.
            </p>

            <p style="margin-top: 28px;">
                Regards,<br>
                <strong>AI Interview Platform Support</strong>
            </p>

            <hr style="border: 0; border-top: 1px solid #e6e8ef;">

            <p style="font-size: 12px; color: #777;">
                This is an automated security email. Please do not reply.
            </p>
        </div>
        """
    }

    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    try:
        response = httpx.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=20.0
        )
        response.raise_for_status()

    except httpx.HTTPError as error:
        raise RuntimeError(
            "Unable to send the verification email."
        ) from error