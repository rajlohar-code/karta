"""
Unit Tests for PBAC (Permission-Based Access Control) Engine.

Tests:
1. Workspace Primary Owner bypass across all capabilities
2. Fine-grained JSONB boolean capability evaluations
3. Deny-First enforcement on ungranted actions
4. PermissionDenied exception triggering via require()
"""
import pytest
from app.core.capabilities import Capability
from app.core.permissions import PermissionChecker, PermissionDenied


def test_owner_full_bypass():
    """Workspace primary owner (user_id == workspace_owner_id) bypasses all capability checks."""
    assert PermissionChecker.is_permitted(
        user_id=1,
        workspace_owner_id=1,
        capability=Capability.EDIT_PERMISSIONS,
    ) is True
    assert PermissionChecker.is_permitted(
        user_id=1,
        workspace_owner_id=1,
        capability=Capability.CREATE_SCHEMAS,
    ) is True


def test_pbac_granted_capability():
    """Collaborator with specific capability set to True is permitted."""
    permissions = {
        "can_view_public_diagrams": True,
        "can_create_schemas": True,
        "can_create_flowcharts": False,
        "can_edit_permissions": False,
    }
    assert PermissionChecker.is_permitted(
        user_id=2,
        workspace_owner_id=1,
        capability=Capability.CREATE_SCHEMAS,
        custom_grants=permissions,
    ) is True
    assert PermissionChecker.is_permitted(
        user_id=2,
        workspace_owner_id=1,
        capability=Capability.VIEW_PUBLIC_DIAGRAMS,
        custom_grants=permissions,
    ) is True


def test_pbac_denied_capability():
    """Collaborator with specific capability set to False is denied immediately (Deny-First)."""
    permissions = {
        "can_view_public_diagrams": True,
        "can_create_schemas": True,
        "can_create_flowcharts": False,
        "can_edit_permissions": False,
    }
    assert PermissionChecker.is_permitted(
        user_id=2,
        workspace_owner_id=1,
        capability=Capability.CREATE_FLOWCHARTS,
        custom_grants=permissions,
    ) is False
    assert PermissionChecker.is_permitted(
        user_id=2,
        workspace_owner_id=1,
        capability=Capability.EDIT_PERMISSIONS,
        custom_grants=permissions,
    ) is False


def test_permission_checker_require_raises_exception():
    """require() raises PermissionDenied when capability is not granted."""
    permissions = {
        "can_view_public_diagrams": True,
        "can_edit_permissions": False,
    }
    with pytest.raises(PermissionDenied) as exc_info:
        PermissionChecker.require(
            user_id=5,
            workspace_owner_id=1,
            capability=Capability.EDIT_PERMISSIONS,
            custom_grants=permissions,
        )
    assert "Permission denied" in str(exc_info.value)
    assert Capability.EDIT_PERMISSIONS.value in str(exc_info.value)

