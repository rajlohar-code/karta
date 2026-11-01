"""
Pluggable Email Service Engine for Karta.

Design Principles:
- Open/Closed Principle (OCP): New providers (Resend, SendGrid, Amazon SES, Custom SMTP)
  can be added by extending EmailProvider without modifying existing core logic.
- Configurable sender email: Never hardcoded, reads from settings or admin configuration.
- Local Development: Logs structured emails to backend/logs/email/email.log.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
import os

from app.config import settings

# Dedicated email log directory
EMAIL_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs", "email")
os.makedirs(EMAIL_LOG_DIR, exist_ok=True)
EMAIL_LOG_FILE = os.path.join(EMAIL_LOG_DIR, "email.log")


class EmailProvider(ABC):
    """Abstract Base Class for all Email delivery implementations."""

    @abstractmethod
    async def send_invitation_email(
        self,
        recipient_email: str,
        workspace_name: str,
        inviter_name: str,
        role: str,
        invite_token: str,
        sender_email: str | None = None,
    ) -> bool:
        """
        Send a workspace invitation email containing the acceptance token link.
        
        Parameters:
          recipient_email : Address of the person being invited
          workspace_name  : Name of the workspace they are joining
          inviter_name    : Name of the team member who sent the invite
          role            : Assigned role ('editor' or 'viewer')
          invite_token    : Cryptographic token for the acceptance link
          sender_email    : Optional sender email override (defaults to settings.EMAIL_FROM)
        """
        pass


class ConsoleEmailService(EmailProvider):
    """
    Development & Testing Email Service Provider.
    
    Instead of requiring live third-party API keys (Resend / SendGrid) during development,
    this provider formats the complete, branded email and writes it to `logs/email/email.log`.
    This allows developers to inspect the exact invite link and test the complete workflow locally.
    """

    async def send_invitation_email(
        self,
        recipient_email: str,
        workspace_name: str,
        inviter_name: str,
        role: str,
        invite_token: str,
        sender_email: str | None = None,
    ) -> bool:
        from_address = sender_email or settings.EMAIL_FROM
        invite_url = f"{settings.FRONTEND_URL}/invite/{invite_token}"
        timestamp = datetime.now(timezone.utc).isoformat()

        email_entry = (
            f"\n{'=' * 80}\n"
            f"TIMESTAMP       : {timestamp}\n"
            f"PROVIDER        : ConsoleEmailService (Development)\n"
            f"FROM            : {from_address}\n"
            f"TO              : {recipient_email}\n"
            f"SUBJECT         : {inviter_name} invited you to join '{workspace_name}' on Karta\n"
            f"WORKSPACE       : {workspace_name}\n"
            f"ROLE ASSIGNED   : {role.upper()}\n"
            f"INVITE LINK     : {invite_url}\n"
            f"EXPIRES IN      : 7 Days\n"
            f"{'=' * 80}\n"
        )

        # Write to dedicated audit log
        with open(EMAIL_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(email_entry)

        return True


class SMTPEmailService(EmailProvider):
    """
    Production SMTP Email Provider.
    
    Ready for Admin Panel configuration:
    Admins can set SMTP Host, Port, Username, and Password in the Admin UI.
    """

    def __init__(
        self,
        host: str | None = None,
        port: int = 587,
        username: str | None = None,
        password: str | None = None,
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password

    async def send_invitation_email(
        self,
        recipient_email: str,
        workspace_name: str,
        inviter_name: str,
        role: str,
        invite_token: str,
        sender_email: str | None = None,
    ) -> bool:
        # Placeholder for real aiosmtplib execution when admin SMTP is configured
        # Falls back to ConsoleEmailService if host is not configured
        if not self.host:
            fallback = ConsoleEmailService()
            return await fallback.send_invitation_email(
                recipient_email=recipient_email,
                workspace_name=workspace_name,
                inviter_name=inviter_name,
                role=role,
                invite_token=invite_token,
                sender_email=sender_email,
            )
        # In Phase 4 (Admin Panel), aiosmtplib connects to self.host here
        return True


# Global default factory
def get_email_service() -> EmailProvider:
    """Dependency provider returning the active EmailProvider."""
    return ConsoleEmailService()
