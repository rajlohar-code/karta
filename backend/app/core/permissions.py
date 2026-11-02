from typing import Collection
from app.core.capabilities import Capability, ROLE_CAPABILITIES


class PermissionDenied(Exception):
    """
    Raised when an actor attempts an action without holding the required Capability.
    Translates to HTTP 403 Forbidden in REST routes or WebSocket error frames.
    """
    def __init__(self, capability: Capability | str, role: str | None = None):
        cap_name = capability.value if isinstance(capability, Capability) else str(capability)
        msg = f"Permission denied: action '{cap_name}' is not permitted"
        if role:
            msg += f" for role '{role}'"
        super().__init__(msg)
        self.capability = cap_name
        self.role = role


class PermissionChecker:
    """
    Core Capability Authorization Engine (PBAC).
    Grounded in: karta_security.md (Layer 2 — Authorization: Deny First)
    
    ---------------------------------------------------------------------------
    SECURITY PRINCIPLE: DENY FIRST
    - Access is NEVER assumed or granted by default.
    - Owner/Creator has full bypass authority.
    - Delegated members are checked against their 13 JSONB capability flags.
    - If a capability flag is False or missing, access is immediately DENIED.
    ---------------------------------------------------------------------------
    """

    @staticmethod
    def is_permitted(
        role: str | None = None,
        capability: Capability | str = "",
        custom_grants: Collection[str] | dict[str, bool] | None = None,
        user_id: int | None = None,
        workspace_owner_id: int | None = None,
    ) -> bool:
        """
        Pure function checking if an action is permitted under Deny-First PBAC rules.
        
        Parameters:
          role               : Workspace role ('owner', 'editor', 'viewer', etc.)
          capability         : The Capability action attempting to be performed
          custom_grants      : Explicit JSONB permissions dict or set of granted capability names
          user_id            : ID of currently authenticated user (optional)
          workspace_owner_id : ID of the workspace creator/owner (optional)
          
        Returns:
          True if permitted, False otherwise (Deny-First).
        """
        # Rule 1: Workspace Creator / Primary Owner has full bypass
        if user_id is not None and workspace_owner_id is not None and user_id == workspace_owner_id:
            return True

        if role in ("owner", "admin"):
            return True

        cap_key = capability.value if isinstance(capability, Capability) else str(capability)

        # Rule 2: If member has explicit JSONB permissions dictionary (PBAC)
        if isinstance(custom_grants, dict):
            if custom_grants.get(cap_key, False) is True:
                return True
            return False

        # Rule 3: If custom_grants is a set/collection of strings
        if custom_grants and cap_key in custom_grants:
            return True

        # Rule 4: Fallback to role capability set
        if role:
            allowed_caps = ROLE_CAPABILITIES.get(role, set())
            if cap_key in allowed_caps:
                return True

        # Deny by default
        return False

    @staticmethod
    def require(
        role: str | None = None,
        capability: Capability | str = "",
        custom_grants: Collection[str] | dict[str, bool] | None = None,
        user_id: int | None = None,
        workspace_owner_id: int | None = None,
    ) -> None:
        """
        Enforcement method: checks permission and raises PermissionDenied if unauthorized.
        Used at the top of route handlers, WebSocket commands, and AI router calls.
        """
        if not PermissionChecker.is_permitted(
            role=role,
            capability=capability,
            custom_grants=custom_grants,
            user_id=user_id,
            workspace_owner_id=workspace_owner_id,
        ):
            raise PermissionDenied(capability=capability, role=role)
