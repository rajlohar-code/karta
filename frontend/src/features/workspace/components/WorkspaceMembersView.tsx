import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Sliders,
  Check,
  X,
  Sparkles,
  Layers,
  FolderLock,
} from 'lucide-react';
import type {
  WorkspaceMemberItem,
  WorkspacePermissions,
} from '../../../types/workspace';
import { DEFAULT_WORKSPACE_PERMISSIONS, PERMISSION_METADATA } from '../../../types/workspace';

interface WorkspaceMembersViewProps {
  workspaceName: string;
  members: WorkspaceMemberItem[];
  onBackToCanvas: () => void;
  onOpenInviteModal: () => void;
  onUpdateMemberPermissions: (userId: number, permissions: WorkspacePermissions) => void;
  onRemoveMember: (userId: number) => void;
}

/**
 * WorkspaceMembersView Component
 * High-End, Linear/Supabase-Grade Collaborator Management Dashboard
 * Grounded in: karta_design_system.md and project_structure_lld.md
 */
export const WorkspaceMembersView: React.FC<WorkspaceMembersViewProps> = ({
  workspaceName: _workspaceName,
  members,
  onOpenInviteModal,
  onUpdateMemberPermissions,
  onRemoveMember,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingMember, setEditingMember] = useState<WorkspaceMemberItem | null>(null);
  const [tempPermissions, setTempPermissions] = useState<WorkspacePermissions | null>(null);

  // Filter collaborators by name or email
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const handleStartEdit = (member: WorkspaceMemberItem) => {
    setEditingMember(member);
    setTempPermissions({
      ...DEFAULT_WORKSPACE_PERMISSIONS,
      ...member.permissions,
    });
  };

  const handleTogglePermission = (key: keyof WorkspacePermissions) => {
    if (!tempPermissions) return;
    setTempPermissions({
      ...tempPermissions,
      [key]: !tempPermissions[key],
    });
  };

  const handleSavePermissions = () => {
    if (!editingMember || !tempPermissions) return;
    onUpdateMemberPermissions(editingMember.id, tempPermissions);
    setEditingMember(null);
    setTempPermissions(null);
  };

  const categories: Array<'Diagrams' | 'Projects' | 'AI' | 'Collaborators'> = [
    'Diagrams',
    'Projects',
    'AI',
    'Collaborators',
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8 flex flex-col font-sans select-none min-h-[calc(100vh-3rem)]">
      {/* ----------------------------------------------------------------- */}
      {/* Page Header Section (SaaS Standard: Title + Subtitle + Action)     */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Workspace Collaborators
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {members.length} {members.length === 1 ? 'collaborator' : 'collaborators'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage who has access to this workspace and configure fine-grained capability permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenInviteModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl transition-all shadow-sm shadow-emerald-800/15 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Collaborator</span>
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Search & Filter Toolbar                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collaborators by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition-all"
          />
        </div>

        <div className="text-xs text-gray-400 font-medium hidden sm:block">
          Showing {filteredMembers.length} of {members.length}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Structured Collaborators Table Card                               */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        {/* Table Column Headers */}
        <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
          <div className="flex-1">Collaborator</div>
          <div className="w-56 text-left hidden sm:block">Access & Capabilities</div>
          <div className="w-36 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-100">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const activePermsCount = Object.values(member.permissions || {}).filter(Boolean).length;

              return (
                <div
                  key={member.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Column 1: Collaborator Identity */}
                  <div className="flex items-center gap-3 truncate flex-1">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-9 h-9 rounded-full border border-gray-200 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="truncate">
                      <span className="font-semibold text-[13px] text-gray-900 block truncate">
                        {member.name}
                      </span>
                      <span className="text-[11px] text-gray-400 block truncate leading-tight mt-0.5">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Access & Capabilities */}
                  <div className="w-56 text-left hidden sm:block">
                    {member.is_owner ? (
                      <span className="text-xs font-medium text-gray-700">
                        Workspace Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        <span>{activePermsCount} of 13 Capabilities</span>
                      </span>
                    )}
                  </div>

                  {/* Column 3: Actions */}
                  <div className="w-36 flex items-center justify-end gap-2 flex-shrink-0">
                    {!member.is_owner && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(member)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5 text-gray-500" />
                          <span>Permissions</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${member.name} from this workspace?`)) {
                              onRemoveMember(member.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove collaborator"
                          aria-label="Remove collaborator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-14 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-gray-600">No collaborators found</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {searchQuery ? `No matches for "${searchQuery}"` : 'No collaborators in this workspace.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Elegant, Uncluttered Permissions Modal Dialog                     */}
      {/* ----------------------------------------------------------------- */}
      {editingMember && tempPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                    Collaborator Permissions
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {editingMember.name} • {editingMember.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Clean 1-Column Capability Rows with Toggle Switches */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/30">
              {categories.map((category) => {
                const categoryKeys = (Object.keys(PERMISSION_METADATA) as Array<keyof WorkspacePermissions>).filter(
                  (key) => PERMISSION_METADATA[key].category === category
                );

                return (
                  <div key={category} className="space-y-2">
                    {/* Category Title */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                      {category === 'Diagrams' && <Layers className="w-3.5 h-3.5 text-emerald-600" />}
                      {category === 'Projects' && <FolderLock className="w-3.5 h-3.5 text-blue-600" />}
                      {category === 'AI' && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                      {category === 'Collaborators' && <Users className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{category}</span>
                    </div>

                    {/* Clean Rows */}
                    <div className="bg-white rounded-xl border border-gray-200/90 divide-y divide-gray-100 shadow-2xs overflow-hidden">
                      {categoryKeys.map((key) => {
                        const meta = PERMISSION_METADATA[key];
                        const isChecked = tempPermissions[key];

                        return (
                          <div
                            key={key}
                            onClick={() => handleTogglePermission(key)}
                            className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/70 cursor-pointer transition-colors"
                          >
                            <div className="flex flex-col pr-2">
                              <span className="text-[13px] font-medium text-gray-900 leading-tight">
                                {meta.label}
                              </span>
                              <span className="text-[11px] text-gray-400 leading-snug mt-0.5">
                                {meta.description}
                              </span>
                            </div>

                            {/* Accessible iOS-Style Toggle Switch */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isChecked}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePermission(key);
                              }}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isChecked ? 'bg-emerald-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  isChecked ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-gray-500 font-medium">
                {Object.values(tempPermissions).filter(Boolean).length} of 13 enabled
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-xs transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceMembersView;
