import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Table2,
  Key,
  Link2,
  MoreVertical,
  Plus,
  Settings,
  FileSpreadsheet,
  Trash2,
  Check,
  X,
  Palette,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { TableNodeData, ColumnDefinition } from '../../../../types/schema';

/**
 * Standard SQL Data Types for Quick Selection
 */
const COMMON_DATA_TYPES = [
  'uuid',
  'varchar(255)',
  'text',
  'integer',
  'bigint',
  'boolean',
  'timestamptz',
  'numeric(10,2)',
  'jsonb',
];

/**
 * Color Swatches for 1-Click Fast Themes
 */
const COLOR_SWATCHES = [
  '#166534', // Forest Green
  '#2563eb', // Indigo Blue
  '#0f766e', // Ocean Teal
  '#7e22ce', // Royal Purple
  '#dc2626', // Crimson Red
  '#d97706', // Amber Orange
  '#1e293b', // Slate Navy
  '#18181b', // Midnight Black
];

/**
 * TableNode Component — High-Trust Database Schema Table
 * Grounded in: karta_design_system.md
 *
 * FEATURES:
 * 1. Clean, readable sans-serif typography (System sans / Inter)
 * 2. Header '+' button opens Add Column directly attached below header
 * 3. Settings gear opens Table Rename + Any Color Picker (input color + hex + swatches)
 * 4. Column 3-dots opens comprehensive Column Editor (Rename, Type, PK, Not Null, Delete)
 * 5. Grid icon triggers Sample Records Modal
 */
export const TableNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as TableNodeData;
  const headerBg =
    nodeData.style?.header_bg ||
    'linear-gradient(135deg, #14532d 0%, #166534 100%)';

  // Popovers state
  const [isAddColumnOpen, setIsAddColumnOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);

  // Add Column Form state
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<string>('varchar(255)');
  const [newColIsPk, setNewColIsPk] = useState<boolean>(false);
  const [newColIsNullable, setNewColIsNullable] = useState<boolean>(true);

  // Table Settings Form state
  const [tableNameInput, setTableNameInput] = useState<string>(nodeData.name);
  const [customColor, setCustomColor] = useState<string>('#166534');

  // Table Collapse state (per-node)
  const [isLocalCollapsed, setIsLocalCollapsed] = useState<boolean>(false);
  const isCollapsed = nodeData.isCollapsed !== undefined ? nodeData.isCollapsed : isLocalCollapsed;

  const handleToggleCollapse = () => {
    if (nodeData.onToggleCollapse) {
      nodeData.onToggleCollapse();
    } else {
      setIsLocalCollapsed(!isLocalCollapsed);
    }
  };

  // Filter columns based on Canvas-wide filter mode (All, Keys Only, PK Only, FK Only)
  const filteredColumns = React.useMemo(() => {
    if (!nodeData.columns) return [];
    const mode = nodeData.columnFilter || 'all';
    if (mode === 'keys_only') {
      return nodeData.columns.filter((c) => c.is_primary_key || c.is_foreign_key);
    }
    if (mode === 'pk_only') {
      return nodeData.columns.filter((c) => c.is_primary_key);
    }
    if (mode === 'fk_only') {
      return nodeData.columns.filter((c) => c.is_foreign_key);
    }
    return nodeData.columns;
  }, [nodeData.columns, nodeData.columnFilter]);

  // Edit Column Form state
  const [editColName, setEditColName] = useState<string>('');
  const [editColType, setEditColType] = useState<string>('varchar(255)');
  const [editColIsPk, setEditColIsPk] = useState<boolean>(false);
  const [editColIsNullable, setEditColIsNullable] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsAddColumnOpen(false);
        setIsSettingsOpen(false);
        setEditingColumn(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Submit Add Column
  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const newCol: ColumnDefinition = {
      name: newColName.trim().toLowerCase().replace(/\s+/g, '_'),
      type: newColType,
      is_primary_key: newColIsPk,
      is_nullable: newColIsPk ? false : newColIsNullable,
    };

    if (nodeData.onAddColumn) {
      nodeData.onAddColumn(newCol);
    }

    setNewColName('');
    setNewColIsPk(false);
    setNewColIsNullable(true);
    setIsAddColumnOpen(false);
  };

  // Submit Table Rename
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNameInput.trim() && nodeData.onRenameTable) {
      nodeData.onRenameTable(tableNameInput.trim());
    }
    setIsSettingsOpen(false);
  };

  // Apply Custom Color
  const handleColorChange = (hex: string) => {
    setCustomColor(hex);
    if (nodeData.onChangeColor) {
      nodeData.onChangeColor(hex);
    }
  };

  // Open Edit Column Popover
  const handleStartEditColumn = (col: ColumnDefinition) => {
    setEditingColumn(col);
    setEditColName(col.name);
    setEditColType(col.type);
    setEditColIsPk(!!col.is_primary_key);
    setEditColIsNullable(col.is_nullable !== false);
    setIsAddColumnOpen(false);
    setIsSettingsOpen(false);
  };

  // Save Edit Column
  const handleSaveEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn || !editColName.trim()) return;

    const updatedCol: ColumnDefinition = {
      ...editingColumn,
      name: editColName.trim().toLowerCase().replace(/\s+/g, '_'),
      type: editColType,
      is_primary_key: editColIsPk,
      is_nullable: editColIsPk ? false : editColIsNullable,
    };

    if (nodeData.onUpdateColumn) {
      nodeData.onUpdateColumn(editingColumn.name, updatedCol);
    } else if (nodeData.onDeleteColumn && nodeData.onAddColumn) {
      // Fallback
      nodeData.onDeleteColumn(editingColumn.name);
      nodeData.onAddColumn(updatedCol);
    }

    setEditingColumn(null);
  };

  return (
    <div
      ref={containerRef}
      className={`min-w-[260px] max-w-[340px] bg-white rounded-xl border transition-all duration-150 select-none shadow-sm relative font-sans ${
        selected
          ? 'border-emerald-600 shadow-xl ring-2 ring-emerald-500/40'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* ----------------------------------------------------------------- */}
      {/* 1. Table Header                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`group/header relative flex items-center justify-between px-3.5 py-2.5 text-white border-b border-white/10 transition-all ${
          isCollapsed ? 'rounded-[11px] border-b-0' : 'rounded-t-[11px]'
        }`}
        style={{ background: headerBg }}
      >
        <div className="flex items-center gap-1.5 truncate">
          {/* Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            className="p-0.5 hover:bg-white/20 text-white/90 hover:text-white rounded transition-colors flex-shrink-0"
            title={isCollapsed ? 'Expand table' : 'Collapse table'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <Table2 className="w-4 h-4 text-emerald-100 flex-shrink-0" />
          <span className="font-bold text-[13.5px] tracking-tight truncate font-sans">
            {nodeData.name}
          </span>

          {isCollapsed && (
            <span className="text-[10.5px] font-medium bg-white/20 px-1.5 py-0.2 rounded-full text-white/90 ml-1 flex-shrink-0">
              {nodeData.columns?.length || 0} cols
            </span>
          )}
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Quick '+ Add Column' Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddColumnOpen(!isAddColumnOpen);
              setIsSettingsOpen(false);
              setEditingColumn(null);
            }}
            className="p-1 hover:bg-white/20 text-white/90 hover:text-white rounded transition-colors"
            title="Add column to table"
            aria-label="Add column"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* View Sample Data Records */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (nodeData.onViewRecords) {
                nodeData.onViewRecords(nodeData.name);
              }
            }}
            className="p-1 hover:bg-white/20 text-white/90 hover:text-white rounded transition-colors"
            title="View sample records & CSV export"
            aria-label="View sample data"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>

          {/* Table Settings (Rename & Any Color Picker) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen(!isSettingsOpen);
              setIsAddColumnOpen(false);
              setEditingColumn(null);
            }}
            className="p-1 hover:bg-white/20 text-white/90 hover:text-white rounded transition-colors"
            title="Table settings (rename & color)"
            aria-label="Table settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* POPOVER A: Add Column to Table (Attached directly below header) */}
        {/* --------------------------------------------------------------- */}
        {isAddColumnOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-2xl p-3.5 z-50 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900">Add New Column</span>
              <button
                type="button"
                onClick={() => setIsAddColumnOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddColumnSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Column Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. status, created_at"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white font-sans"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Data Type
                </label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white font-sans"
                >
                  {COMMON_DATA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newColIsPk}
                    onChange={(e) => {
                      setNewColIsPk(e.target.checked);
                      if (e.target.checked) setNewColIsNullable(false);
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>PK</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={newColIsPk}
                    checked={!newColIsNullable}
                    onChange={(e) => setNewColIsNullable(!e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Not Null</span>
                </label>
              </div>

              <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddColumnOpen(false)}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* POPOVER B: Table Settings (Rename + ANY Color Picker)           */}
        {/* --------------------------------------------------------------- */}
        {isSettingsOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-2xl p-3.5 z-50 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900">Table Settings</span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rename Table Form */}
            <form onSubmit={handleRenameSubmit} className="space-y-3">
              <div>
                <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Table Name
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white font-sans"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Color Customizer (Any Color Picker + Swatches) */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Palette className="w-3 h-3 text-emerald-600" />
                    <span>Header Color</span>
                  </label>
                  {/* Native Color Picker for ANY Custom Color */}
                  <label
                    className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900"
                    title="Pick any custom color"
                  >
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border border-gray-300"
                    />
                    <span className="font-mono text-[11px] text-gray-500 uppercase">{customColor}</span>
                  </label>
                </div>

                {/* Quick Swatches */}
                <div className="grid grid-cols-8 gap-1.5 pt-1">
                  {COLOR_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleColorChange(hex)}
                      className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 shadow-2xs ${
                        customColor.toLowerCase() === hex.toLowerCase()
                          ? 'ring-2 ring-emerald-500 border-white'
                          : 'border-black/10'
                      }`}
                      style={{ background: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>

              {/* Delete Table Action */}
              {nodeData.onDeleteTable && (
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete table "${nodeData.name}"?`)) {
                        nodeData.onDeleteTable!();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Table</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Top & Bottom Table Handles for High-Level ERD Mapping */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-top`}
        className="!w-2 !h-2 !bg-gray-400 !border-2 !border-white hover:!bg-emerald-600 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-bottom`}
        className="!w-2 !h-2 !bg-gray-400 !border-2 !border-white hover:!bg-emerald-600 hover:!scale-125 transition-transform"
      />

      {/* ----------------------------------------------------------------- */}
      {/* 2. Column Rows List (Clean Sans-Serif Typography)                */}
      {/* ----------------------------------------------------------------- */}
      {!isCollapsed && (
        <div className="divide-y divide-gray-100 text-xs font-sans">
          {filteredColumns && filteredColumns.length > 0 ? (
            filteredColumns.map((col) => {
              const isPk = col.is_primary_key;
              const isFk = col.is_foreign_key;
              const isEditingThis = editingColumn?.name === col.name;

              return (
                <div
                  key={col.name}
                  className="relative group flex items-center justify-between px-3.5 py-2 hover:bg-emerald-50/40 transition-colors"
                >
                  {/* Column Target Handle (Left: incoming FK reference) */}
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`${nodeData.name}.${col.name}.target`}
                    className="!w-2.5 !h-2.5 !-left-1.5 !bg-gray-300 !border-2 !border-white group-hover:!bg-emerald-600 hover:!scale-125 transition-all"
                  />

                  {/* Left: Column Identity & Constraints */}
                  <div className="flex items-center gap-2 truncate pr-2">
                    {isPk ? (
                      <span
                        title="Primary Key"
                        className="inline-flex items-center gap-0.5 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200/90 shadow-2xs"
                      >
                        <Key className="w-2.5 h-2.5 text-amber-600" />
                        PK
                      </span>
                    ) : isFk ? (
                      <span
                        title={`Foreign Key -> ${col.references?.table || 'table'}`}
                        className="inline-flex items-center gap-0.5 text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-200/90 shadow-2xs"
                      >
                        <Link2 className="w-2.5 h-2.5 text-blue-600" />
                        FK
                      </span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 mx-0.5" />
                    )}

                    <span
                      className={`truncate text-[13px] tracking-tight ${
                        isPk ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                      }`}
                    >
                      {col.name}
                    </span>
                  </div>

                  {/* Right: Clean Type Tag, NN Constraint, & Hover 3-dots */}
                  <div className="flex items-center gap-1.5 text-gray-500 flex-shrink-0">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider font-sans">
                      {col.type}
                    </span>
                    {!col.is_nullable && (
                      <span
                        title="Not Null"
                        className="text-[9.5px] font-bold text-gray-500 bg-gray-100 px-1 py-0.5 rounded border border-gray-200/70"
                      >
                        NN
                      </span>
                    )}

                    {/* Column 3-Dots Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditingThis) {
                          setEditingColumn(null);
                        } else {
                          handleStartEditColumn(col);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-900 transition-opacity"
                      title="Edit column settings"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* ------------------------------------------------------------- */}
                    {/* POPOVER C: Full Column Editor Popover                         */}
                    {/* ------------------------------------------------------------- */}
                    {isEditingThis && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 text-gray-900 text-left font-sans animate-in fade-in-50 zoom-in-95 duration-100"
                      >
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-900">Edit Column</span>
                          <button
                            type="button"
                            onClick={() => setEditingColumn(null)}
                            className="p-0.5 text-gray-400 hover:text-gray-700 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveEditColumn} className="space-y-2.5">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                              Column Name
                            </label>
                            <input
                              type="text"
                              required
                              value={editColName}
                              onChange={(e) => setEditColName(e.target.value)}
                              className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                              Data Type
                            </label>
                            <select
                              value={editColType}
                              onChange={(e) => setEditColType(e.target.value)}
                              className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                            >
                              {COMMON_DATA_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editColIsPk}
                                onChange={(e) => {
                                  setEditColIsPk(e.target.checked);
                                  if (e.target.checked) setEditColIsNullable(false);
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>PK</span>
                            </label>

                            <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={editColIsPk}
                                checked={!editColIsNullable}
                                onChange={(e) => setEditColIsNullable(!e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>Not Null</span>
                            </label>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            {nodeData.onDeleteColumn && (
                              <button
                                type="button"
                                onClick={() => {
                                  nodeData.onDeleteColumn!(col.name);
                                  setEditingColumn(null);
                                }}
                                className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1"
                                title="Delete column"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            )}

                            <div className="flex gap-1.5 ml-auto">
                              <button
                                type="button"
                                onClick={() => setEditingColumn(null)}
                                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Column Source Handle (Right: outgoing relation) */}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${nodeData.name}.${col.name}.source`}
                    className="!w-2.5 !h-2.5 !-right-1.5 !bg-gray-300 !border-2 !border-white group-hover:!bg-emerald-600 hover:!scale-125 transition-all"
                  />
                </div>
              );
            })
          ) : (
            <div className="px-4 py-3 text-center text-xs text-gray-400 italic">
              {nodeData.columnFilter && nodeData.columnFilter !== 'all'
                ? 'No matching fields for filter.'
                : 'No columns defined. Click \u2018+\u2019 above to add.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(TableNode);
