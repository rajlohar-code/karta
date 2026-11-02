/**
 * Schema & Visual Canvas Domain Types
 * Grounded in: karta_design_system.md and SRS v1.1 Section 6
 *
 * PYTHON BRIDGE:
 * Equivalent to `backend/app/domains/diagrams/schemas.py` and
 * `backend/app/core/commands/schema_commands.py`.
 */

export interface ColumnDefinition {
  name: string;
  type: string;             // e.g. "uuid", "varchar(255)", "timestamptz", "integer"
  is_primary_key?: boolean; // Primary key flag
  is_foreign_key?: boolean; // Foreign key flag
  is_nullable?: boolean;    // Allow NULL?
  references?: {
    table: string;
    column: string;
  };
}

export interface StyleOverride {
  bg?: string;              // Node background color
  header_bg?: string;       // Table header background (default #16a34a)
  border?: string;          // Border stroke color
  text?: string;            // Text color
  stroke?: string;          // Relation line stroke
  stroke_width?: number;    // Relation line width
}

export type ColumnFilterMode = 'all' | 'keys_only' | 'pk_only' | 'fk_only';

export interface TableNodeData {
  name: string;
  columns: ColumnDefinition[];
  style?: StyleOverride;
  isCollapsed?: boolean;
  columnFilter?: ColumnFilterMode;
  onToggleCollapse?: () => void;
  onRenameTable?: (newName: string) => void;
  onChangeColor?: (color: string) => void;
  onDeleteTable?: () => void;
  onAddColumn?: (col: ColumnDefinition) => void;
  onUpdateColumn?: (oldColName: string, updatedCol: ColumnDefinition) => void;
  onDeleteColumn?: (colName: string) => void;
  onTogglePkColumn?: (colName: string) => void;
  onViewRecords?: (tableName: string) => void;
  [key: string]: unknown;
} 

export type FlowNodeType = 'terminal' | 'process' | 'decision';

export interface FlowNodeData {
  label: string;
  node_type?: FlowNodeType;
  description?: string;
  status?: 'start' | 'end' | 'active' | 'success' | 'failure';
  style?: StyleOverride;
  [key: string]: unknown;
}

