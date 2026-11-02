from enum import StrEnum


class Capability(StrEnum):
    """
    Granular action capabilities for the Karta PBAC permission system.
    Grounded in: karta_security.md (Layer 2) & project_structure_lld.md (Section 3)
    Mirrors frontend/src/types/workspace.ts
    
    ---------------------------------------------------------------------------
    OPEN/CLOSED PRINCIPLE (OCP):
    To add a new capability in the future (e.g. 'can_manage_billing'),
    you add ONE line here. The PermissionChecker logic never needs modification!
    ---------------------------------------------------------------------------
    """
    # -------------------------------------------------------------------------
    # 1. Diagrams Capabilities (ERD & Architecture Flows)
    # -------------------------------------------------------------------------
    VIEW_PUBLIC_DIAGRAMS                = "can_view_public_diagrams"
    CREATE_SCHEMAS                      = "can_create_schemas"
    CREATE_FLOWCHARTS                   = "can_create_flowcharts"
    CREATE_PUBLIC_DIAGRAMS              = "can_create_public_diagrams"
    EDIT_PUBLIC_SCHEMAS                 = "can_edit_public_schemas"
    EDIT_PRIVATE_DIAGRAMS_IF_ADDED      = "can_edit_private_diagrams_if_added"

    # -------------------------------------------------------------------------
    # 2. Projects Capabilities (Folders & Groupings)
    # -------------------------------------------------------------------------
    CREATE_PUBLIC_PROJECTS              = "can_create_public_projects"
    CREATE_PRIVATE_PROJECTS             = "can_create_private_projects"
    ADD_MEMBERS_TO_PRIVATE_PROJECTS     = "can_add_members_to_private_projects_if_added"

    # -------------------------------------------------------------------------
    # 3. AI Copilot Capabilities
    # -------------------------------------------------------------------------
    USE_READONLY_AI                     = "can_use_readonly_ai"
    USE_AI_GENERATION                   = "can_use_ai_generation"

    # -------------------------------------------------------------------------
    # 4. Collaborator & Permission Administration
    # -------------------------------------------------------------------------
    VIEW_PERMISSIONS                    = "can_view_permissions"
    EDIT_PERMISSIONS                    = "can_edit_permissions"

    # -------------------------------------------------------------------------
    # Backward-Compatibility Aliases
    # -------------------------------------------------------------------------
    VIEW_DIAGRAM                        = "can_view_public_diagrams"
    EDIT_DIAGRAM                        = "can_edit_public_schemas"
    INVITE_MEMBERS                      = "can_edit_permissions"
    EXPORT_SQL                          = "export_sql"
    VIEW_HISTORY                        = "view_history"
    RESTORE_VERSION                     = "restore_version"
    USE_AI                              = "can_use_ai_generation"
    VIEW_COMMENTS                       = "view_comments"
    ADD_COMMENTS                        = "add_comments"


# -----------------------------------------------------------------------------
# Role-to-Capability Fallback Mappings
# -----------------------------------------------------------------------------
ROLE_CAPABILITIES: dict[str, set[str]] = {
    # Viewer: Read-only access to inspect canvas and view comments
    "viewer": {
        Capability.VIEW_PUBLIC_DIAGRAMS.value,
        Capability.USE_READONLY_AI.value,
        Capability.VIEW_COMMENTS.value,
    },
    
    # Editor: Can create diagrams, edit public schemas, use AI generation
    "editor": {
        Capability.VIEW_PUBLIC_DIAGRAMS.value,
        Capability.CREATE_SCHEMAS.value,
        Capability.CREATE_FLOWCHARTS.value,
        Capability.CREATE_PUBLIC_DIAGRAMS.value,
        Capability.EDIT_PUBLIC_SCHEMAS.value,
        Capability.EDIT_PRIVATE_DIAGRAMS_IF_ADDED.value,
        Capability.CREATE_PUBLIC_PROJECTS.value,
        Capability.CREATE_PRIVATE_PROJECTS.value,
        Capability.USE_READONLY_AI.value,
        Capability.USE_AI_GENERATION.value,
        Capability.EXPORT_SQL.value,
        Capability.VIEW_HISTORY.value,
        Capability.VIEW_COMMENTS.value,
        Capability.ADD_COMMENTS.value,
    },
    
    # Owner & Admin: Complete administrative control across all capabilities
    "owner": {c.value for c in Capability},
    "admin": {c.value for c in Capability},
}
