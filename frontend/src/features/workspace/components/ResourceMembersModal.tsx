import React, { useState, useMemo } from 'react';
import { X, Check, Search, ShieldAlert, UserPlus, Trash2, FolderLock, FileLock2 } from 'lucide-react';
import type { WorkspaceMemberItem } from '../../../types/workspace';

interface ResourceMembersModalProps {
  isOpen: boolean;
  resourceTitle: string;
  resourceType: 'project' | 'diagram';
  workspaceMembers: WorkspaceMemberItem[];
  assignedMemberIds: number[];
  onSave: (selectedUserIds: number[]) => void;
  onClose: () => void;
}

/**
 * ResourceMembersModal Component
 * Manages explicit collaborator access to a Private Project or Private Diagram
 * Grounded in: karta_design_system.md
 */
export const ResourceMembersModal: React.FC<ResourceMembersModalProps> = ({
  isOpen,
  resourceTitle,
  resourceType,
  workspaceMembers,
  assignedMemberIds,
  onSave,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(assignedMemberIds)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  React.useEffect(() => {
    setSelectedIds(new Set(assignedMemberIds));
  }, [assignedMemberIds]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return workspaceMembers;
    const q = searchQuery.toLowerCase();
    return workspaceMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [workspaceMembers, searchQuery]);

  if (!isOpen) return null;

  const handleToggleMember = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              {resourceType === 'project' ? (
                <FolderLock className="w-4 h-4" />
              ) : (
                <FileLock2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Manage Access: {resourceTitle}
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                Private {resourceType === 'project' ? 'Project Folder' : 'Diagram'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Box */}
        <div className="px-5 py-2.5 bg-amber-50/60 border-b border-amber-100 flex items-start gap-2 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            Only added collaborators who have the capability{' '}
            <strong>
              &ldquo;
              {resourceType === 'project'
                ? 'Manage Collaborators in Private Projects'
                : 'Edit Private Diagrams (If Added)'}
              &rdquo;
            </strong>{' '}
            can view and edit this resource.
          </span>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collaborators..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Members List */}
        <div className="max-h-64 overflow-y-auto p-3 space-y-1 divide-y divide-gray-50">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const isAssigned = selectedIds.has(member.id) || !!member.is_owner;
              const isOwner = member.is_owner;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-gray-900 truncate">
                          {member.name}
                        </span>
                        {isOwner && (
                          <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 block truncate">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  {isOwner ? (
                    <span className="text-xs font-semibold text-gray-400 italic">
                      Always has access
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleMember(member.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isAssigned
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 shadow-2xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Remove</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-gray-400 italic">
              No matching members found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
          <span>{selectedIds.size} members have explicit access</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Access</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceMembersModal;
