import React, { useState, useMemo } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Search,
  Table2,
  Workflow,
  Sparkles,
} from 'lucide-react';
import type { Node } from '@xyflow/react';

interface DiagramViewsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  hiddenNodeIds: Set<string>;
  selectedNodeId?: string | null;
  onToggleNodeVisibility: (nodeId: string) => void;
  onToggleAllVisibility: (visible: boolean) => void;
  onSelectTable: (nodeId: string) => void;
}

/**
 * DiagramViewsDrawer Component — Clean, Focused Table Outline Sidebar
 * Grounded in: karta_design_system.md
 *
 * FEATURES:
 * 1. Clean Search bar to filter tables instantly
 * 2. Flat, readable professional list of tables (no clutter, no fake schemas)
 * 3. Eye toggle per table — hides table and all connected relations
 * 4. 1-Click Table Focus: clicking any table automatically selects and highlights it on canvas
 * 5. Batch toggle (Show All / Hide All)
 */
export const DiagramViewsDrawer: React.FC<DiagramViewsDrawerProps> = ({
  isOpen,
  onClose,
  nodes,
  hiddenNodeIds,
  selectedNodeId,
  onToggleNodeVisibility,
  onToggleAllVisibility,
  onSelectTable,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract table and flow nodes with their column/details count
  const tableItems = useMemo(() => {
    return nodes
      .filter((n) => n.type === 'table' || n.type === 'flowNode')
      .map((n) => {
        const data = n.data as Record<string, unknown>;
        const name = (data.name as string) || (data.label as string) || n.id;
        const columns = Array.isArray(data.columns) ? data.columns : [];

        return {
          id: n.id,
          name,
          type: n.type,
          colCount: columns.length,
          selected: n.selected || selectedNodeId === n.id,
        };
      });
  }, [nodes, selectedNodeId]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return tableItems;
    const q = searchQuery.toLowerCase();
    return tableItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [tableItems, searchQuery]);

  const visibleCount = tableItems.filter((item) => !hiddenNodeIds.has(item.id)).length;
  const totalCount = tableItems.length;
  const allVisible = visibleCount === totalCount && totalCount > 0;

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-gray-200 bg-white flex flex-col z-20 h-full shadow-lg animate-in slide-in-from-right duration-150 select-none font-sans">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Table2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 leading-none">
              Tables Outline
            </h4>
            <span className="text-[11px] text-gray-400 font-medium">
              {visibleCount} of {totalCount} visible
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Global Show/Hide Toggle */}
          <button
            type="button"
            onClick={() => onToggleAllVisibility(!allVisible)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={allVisible ? 'Hide all from canvas' : 'Show all on canvas'}
          >
            {allVisible ? (
              <Eye className="w-4 h-4 text-emerald-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Close Drawer */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clean Search Bar */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isHidden = hiddenNodeIds.has(item.id);
            const isSelected = item.selected;

            return (
              <div
                key={item.id}
                onClick={() => onSelectTable(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all group ${
                  isSelected
                    ? 'bg-emerald-50 border border-emerald-300 shadow-xs'
                    : isHidden
                    ? 'bg-gray-50/60 text-gray-400 hover:bg-gray-100/60'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                }`}
              >
                {/* Left: Table Icon & Title */}
                <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                  {item.type === 'flowNode' ? (
                    <Workflow
                      className={`w-4 h-4 flex-shrink-0 ${
                        isHidden ? 'text-gray-300' : 'text-blue-600'
                      }`}
                    />
                  ) : (
                    <Table2
                      className={`w-4 h-4 flex-shrink-0 ${
                        isHidden ? 'text-gray-300' : 'text-emerald-600'
                      }`}
                    />
                  )}

                  <div className="truncate">
                    <span
                      className={`block truncate text-[13px] tracking-tight ${
                        isSelected
                          ? 'font-bold text-emerald-950'
                          : isHidden
                          ? 'line-through text-gray-400'
                          : 'font-semibold text-gray-800'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  {item.colCount > 0 && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ml-auto mr-1 flex-shrink-0 ${
                        isSelected
                          ? 'bg-emerald-200/70 text-emerald-900'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.colCount} cols
                    </span>
                  )}
                </div>

                {/* Right: Eye Visibility Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleNodeVisibility(item.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    isHidden
                      ? 'text-gray-300 hover:text-gray-600 hover:bg-gray-200/50'
                      : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-100/60'
                  }`}
                  title={isHidden ? 'Show on canvas' : 'Hide from canvas'}
                >
                  {isHidden ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-gray-400 italic">
            No matching tables found.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Click any table to highlight & center</span>
        </span>
        <button
          type="button"
          onClick={() => onToggleAllVisibility(true)}
          className="text-emerald-700 font-semibold hover:underline"
        >
          Reset View
        </button>
      </div>
    </aside>
  );
};

export default DiagramViewsDrawer;
