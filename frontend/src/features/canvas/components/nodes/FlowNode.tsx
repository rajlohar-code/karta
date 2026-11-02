import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play, CheckCircle2, Cog, HelpCircle } from 'lucide-react';
import type { FlowNodeData } from '../../../../types/schema';

/**
 * FlowNode Component — Custom React Flow Node for Flowcharts & Logic Trees
 * Grounded in: karta_design_system.md and SRS v1.1 Section 6
 *
 * MENTAL MODEL:
 * Represents an execution or decision block in a flowchart:
 * 1. 'terminal' — Start or End of a workflow (pill shape)
 * 2. 'process'  — An action, calculation, or API call (card shape)
 * 3. 'decision' — Conditional branching with explicit 'Yes' and 'No' ports
 */
export const FlowNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as FlowNodeData;
  const nodeType = nodeData.node_type || 'process';

  // ---------------------------------------------------------------------------
  // 1. TERMINAL NODE (Start / End Pill)
  // ---------------------------------------------------------------------------
  if (nodeType === 'terminal') {
    const isStart = nodeData.status === 'start' || nodeData.label.toLowerCase().includes('start');

    return (
      <div
        className={`relative px-5 py-2.5 rounded-full bg-white border-2 transition-all duration-150 select-none shadow-sm flex items-center gap-2.5 ${
          selected
            ? 'border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
            : isStart
            ? 'border-emerald-600 hover:border-emerald-700'
            : 'border-gray-800 hover:border-black'
        }`}
      >
        {/* Top Target Handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="terminal-top"
          className="!w-2.5 !h-2.5 !bg-gray-300 !border-2 !border-white hover:!bg-emerald-600 transition-colors"
        />

        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            isStart ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isStart ? <Play className="w-2.5 h-2.5 fill-current" /> : <CheckCircle2 className="w-3 h-3" />}
        </div>

        <span className="text-xs font-bold text-gray-900 tracking-tight whitespace-nowrap">
          {nodeData.label || (isStart ? 'Start Workflow' : 'End')}
        </span>

        {/* Bottom Source Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="terminal-bottom"
          className="!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white hover:!scale-125 transition-transform"
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. DECISION NODE (Conditional Branching with Yes/No Outlets)
  // ---------------------------------------------------------------------------
  if (nodeType === 'decision') {
    return (
      <div
        className={`relative min-w-[200px] max-w-[260px] bg-white rounded-2xl border-2 transition-all duration-150 select-none shadow-sm p-3.5 ${
          selected
            ? 'border-amber-500 shadow-lg ring-2 ring-amber-400/30'
            : 'border-amber-400/90 hover:border-amber-500 hover:shadow-md'
        }`}
      >
        {/* Top Input Handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="decision-in"
          className="!w-2.5 !h-2.5 !bg-gray-300 !border-2 !border-white hover:!bg-amber-500 transition-colors"
        />

        {/* Decision Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200/60">
            <HelpCircle className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider font-mono">
            Condition
          </span>
        </div>

        {/* Decision Question */}
        <p className="text-[12.5px] font-semibold text-gray-900 leading-snug">
          {nodeData.label || 'Evaluate condition?'}
        </p>

        {nodeData.description && (
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            {nodeData.description}
          </p>
        )}

        {/* Branch Indicators */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-[10px] font-bold">
          {/* Bottom Outlet Label (False / No) */}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/80">
            False / No
          </span>

          {/* Right Outlet Label (True / Yes) */}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            True / Yes &rarr;
          </span>
        </div>

        {/* Bottom Source Handle (False) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="decision-false"
          className="!w-2.5 !h-2.5 !bg-rose-500 !border-2 !border-white hover:!scale-125 transition-transform"
        />

        {/* Right Source Handle (True) */}
        <Handle
          type="source"
          position={Position.Right}
          id="decision-true"
          className="!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white hover:!scale-125 transition-transform"
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. PROCESS / ACTION NODE (Default)
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`relative min-w-[200px] max-w-[280px] bg-white rounded-xl border transition-all duration-150 select-none shadow-sm p-3.5 ${
        selected
          ? 'border-blue-600 shadow-lg ring-2 ring-blue-400/30'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Top Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="process-top"
        className="!w-2.5 !h-2.5 !bg-gray-300 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />

      {/* Left Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="process-left"
        className="!w-2.5 !h-2.5 !bg-gray-300 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />

      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200/60 mt-0.5">
          <Cog className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col truncate">
          <span className="text-[13px] font-bold text-gray-900 leading-snug">
            {nodeData.label || 'Action Step'}
          </span>
          {nodeData.description && (
            <span className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              {nodeData.description}
            </span>
          )}
        </div>
      </div>

      {/* Right Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="process-right"
        className="!w-2.5 !h-2.5 !bg-blue-600 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      {/* Bottom Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="process-bottom"
        className="!w-2.5 !h-2.5 !bg-blue-600 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(FlowNode);

