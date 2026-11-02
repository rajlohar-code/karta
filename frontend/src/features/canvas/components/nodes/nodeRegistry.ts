import type { NodeTypes } from '@xyflow/react';
import TableNode from './TableNode';
import FlowNode from './FlowNode';
import NoteNode from './NoteNode';

/**
 * Node Registry — Open/Closed Principle (OCP)
 * Grounded in: project_structure_lld.md
 *
 * All custom node types (TableNode, FlowNode, NoteNode) are
 * registered here with pure plain data props (zero raw JSX objects in state).
 */
export const nodeTypes: NodeTypes = {
  table: TableNode,
  flowNode: FlowNode,
  noteNode: NoteNode,
  default: NoteNode, // Safe fallback for any legacy nodes in localStorage
};
