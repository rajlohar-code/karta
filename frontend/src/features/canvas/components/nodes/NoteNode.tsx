import React, { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { StickyNote, Trash2 } from 'lucide-react';

export interface NoteNodeData {
  title?: string;
  text?: string;
  color?: 'amber' | 'blue' | 'emerald' | 'rose';
  onDelete?: () => void;
  onUpdateText?: (newText: string) => void;
}

/**
 * NoteNode Component — Collaborative Canvas Sticky Note / Architecture Memo
 * Grounded in: karta_design_system.md
 *
 * Stores pure plain strings in state (never raw React elements)
 * so it safely serializes/deserializes to and from localStorage without React 19 crashes.
 */
export const NoteNode: React.FC<NodeProps> = ({ id: _id, data, selected }) => {
  const noteData = data as NoteNodeData;
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [content, setContent] = useState<string>(
    noteData.text || 'Documenting table constraints, index strategies, and foreign key triggers.'
  );

  const title = noteData.title || 'Architecture Note';

  const handleBlur = () => {
    setIsEditing(false);
    if (noteData.onUpdateText) {
      noteData.onUpdateText(content);
    }
  };

  return (
    <div
      className={`min-w-[220px] max-w-[280px] p-3.5 bg-[#fefce8] border rounded-2xl shadow-md transition-all select-none ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
          : 'border-amber-200/90 shadow-amber-100/40 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-amber-200/60">
        <div className="flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900 font-mono">
            {title}
          </span>
        </div>
        {noteData.onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              noteData.onDelete!();
            }}
            className="p-1 text-amber-500 hover:text-rose-600 hover:bg-amber-100 rounded transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {isEditing ? (
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          className="w-full bg-amber-50/50 border border-amber-300 rounded-lg p-1.5 text-xs text-amber-950 font-sans focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-none"
        />
      ) : (
        <p
          onClick={() => setIsEditing(true)}
          className="text-xs text-amber-900/90 leading-relaxed cursor-text hover:text-amber-950 min-h-[48px]"
          title="Click to edit note"
        >
          {content}
        </p>
      )}
    </div>
  );
};

export default memo(NoteNode);

