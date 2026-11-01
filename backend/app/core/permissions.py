from typing import Collection
from app.core.capabilities import Capability, ROLE_CAPABILITIES


class PermissionDenied(Exception):
    """
    Raised when an actor attempts an action without holding the required Capability.
    Translates to HTTP 403 Forbidden in REST routes or WebSocket error frames.
    """
    def __init__(self, capability: Capability, role: str | None = None):
        msg = f"Permission denied: action '{capability}' is not permitted"
        if role:
            msg += f" for role '{role}'"
        super().__init__(msg)
        self.capability = capability
        self.role = role


class PermissionChecker:
    """
    Core Capability Authorization Engine.
    Grounded in: karta_security.md (Layer 2 — Authorization: Deny First)
    
    ---------------------------------------------------------------------------
    SECURITY PRINCIPLE: DENY FIRST
    - Access is NEVER assumed or granted by default.
    - If a role is missing, unrecognized, or the capability is not in the set,
      access is immediately DENIED.
    - Frontend hiding of buttons is merely UX; this checker runs on every single
      API endpoint, WebSocket message, AI inference, and RAG retrieval.
    ---------------------------------------------------------------------------
    """

    @staticmethod
    def is_permitted(
        role: str | None,
        capability: Capability,
        custom_grants: Collection[str] | None = None,
    ) -> bool:
        """
        Pure function checking if a role (or custom capability list) allows the action.
        
        Parameters:
          role          : Workspace or diagram role ('owner', 'editor', 'viewer', or None)
          capability    : The specific action attempting to be performed
          custom_grants : Optional list/set of explicit capability overrides from JSONB grants
          
        Returns:
          True if permitted, False otherwise (Deny-First).
        """
        # If no role or unauthorized actor, deny immediately
        if not role:
            return False

        # 1. Check standard role capabilities
        allowed_caps = ROLE_CAPABILITIES.get(role, set())
        if capability in allowed_caps:
            return True

        # 2. Check explicit custom capability overrides from JSONB grants (if present)
        if custom_grants and capability.value in custom_grants:
            return True

        # Deny by default
        return False

    @staticmethod
    def require(
        role: str | None,
        capability: Capability,
        custom_grants: Collection[str] | None = None,
    ) -> None:
        """
        Enforcement method: checks permission and raises PermissionDenied if unauthorized.
        Used at the top of route handlers, WebSocket commands, and AI router calls.
        """
        if not PermissionChecker.is_permitted(role, capability, custom_grants):
            raise PermissionDenied(capability=capability, role=role)
