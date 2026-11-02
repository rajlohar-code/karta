import React, { useState } from 'react';
import { UserPlus, Users, X, Check, Layers, FolderLock, Sparkles } from 'lucide-react';
import type { WorkspacePermissions } from '../../../types/workspace';
import { DEFAULT_WORKSPACE_PERMISSIONS, PERMISSION_METADATA } from '../../../types/workspace';

interface InviteMemberModalProps {
  isOpen: boolean;
  workspaceName: string;
  onClose: () => void;
  onSendInvite: (email: string, permissions: WorkspacePermissions) => void;
  isSending?: boolean;
}

/**
 * InviteMemberModal Component
 * Granular Capability-Based Member Invitation (PBAC)
 * By default: ONLY `can_view_public_diagrams` is true, all other 10 are false.
 */
export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  workspaceName,
  onClose,
  onSendInvite,
  isSending = false,
}) => {
  const [email, setEmail] = useState<string>('');
  const [permissions, setPermissions] = useState<WorkspacePermissions>({
    ...DEFAULT_WORKSPACE_PERMISSIONS,
  });

  if (!isOpen) return null;

  const handleToggle = (key: keyof WorkspacePermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSendInvite(email.trim(), permissions);
  };

  const categories: Array<'Diagrams' | 'Projects' | 'AI' | 'Collaborators'> = [
    'Diagrams',
    'Projects',
    'AI',
    'Collaborators',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans select-none">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-100"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Invite to {workspaceName}
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                Set capabilities for this collaborator
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
          {/* Email Input */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
              Teammate Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs font-sans transition-all"
            />
          </div>

          {/* Granular Capabilities Categories */}
          <div className="space-y-4 pt-1">
            {categories.map((category) => {
              const keys = (Object.keys(PERMISSION_METADATA) as Array<keyof WorkspacePermissions>).filter(
                (k) => PERMISSION_METADATA[k].category === category
              );

              return (
                <div key={category} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                      {category === 'Diagrams' && <Layers className="w-3.5 h-3.5 text-emerald-600" />}
                      {category === 'Projects' && <FolderLock className="w-3.5 h-3.5 text-blue-600" />}
                      {category === 'AI' && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                      {category === 'Collaborators' && <Users className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{category}</span>
                    </div>

                  <div className="bg-white rounded-xl border border-gray-200/90 divide-y divide-gray-100 shadow-2xs overflow-hidden">
                    {keys.map((key) => {
                      const meta = PERMISSION_METADATA[key];
                      const isChecked = permissions[key];

                      return (
                        <div
                          key={key}
                          onClick={() => handleToggle(key)}
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

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isChecked}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(key);
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
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-500 font-medium">
            {Object.values(permissions).filter(Boolean).length} of 13 enabled
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-xs transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Invite'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InviteMemberModal;
