from enum import StrEnum


class Capability(StrEnum):
    """
    Granular action capabilities for the Karta permission system.
    Grounded in: karta_security.md (Layer 2) & project_structure_lld.md (Section 3)
    
    ---------------------------------------------------------------------------
    OPEN/CLOSED PRINCIPLE (OCP):
    To add a new capability in the future (e.g. 'MANAGE_INTEGRATIONS'),
    you add ONE line here. The PermissionChecker logic never needs modification!
    ---------------------------------------------------------------------------
    """
    # Diagram Capabilities
    VIEW_DIAGRAM    = "view_diagram"
    EDIT_DIAGRAM    = "edit_diagram"
    EXPORT_SQL      = "export_sql"
    VIEW_HISTORY    = "view_history"
    RESTORE_VERSION = "restore_version"
    
    # Collaboration & Workspace Capabilities
    INVITE_MEMBERS  = "invite_members"
    VIEW_COMMENTS   = "view_comments"
    ADD_COMMENTS    = "add_comments"
    
    # AI Capabilities (also gated by plan quota)
    USE_AI          = "use_ai"


# -----------------------------------------------------------------------------
# Role-to-Capability Mappings
# -----------------------------------------------------------------------------
# Each workspace or diagram role maps to an exact set of allowed Capabilities.
ROLE_CAPABILITIES: dict[str, set[Capability]] = {
    # Viewer: Read-only access to inspect canvas and read discussion comments
    "viewer": {
        Capability.VIEW_DIAGRAM,
        Capability.VIEW_COMMENTS,
    },
    
    # Editor: Can modify diagram structure, export SQL, review history, use AI, add comments
    "editor": {
        Capability.VIEW_DIAGRAM,
        Capability.EDIT_DIAGRAM,
        Capability.EXPORT_SQL,
        Capability.VIEW_HISTORY,
        Capability.VIEW_COMMENTS,
        Capability.ADD_COMMENTS,
        Capability.USE_AI,
    },
    
    # Owner: Complete administrative control including version restore and member invitations
    "owner": set(Capability),
}
