import React, { useState, useMemo } from 'react';
import { X, Download, Edit3, Check, Table2, Plus, Trash2 } from 'lucide-react';
import type { ColumnDefinition } from '../../../../types/schema';

interface SampleDataModalProps {
  tableName: string;
  columns: ColumnDefinition[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Generate human-readable, professional mock values matching Karta Theme
 */
function generateReadableMockValue(col: ColumnDefinition, rowIndex: number): string {
  const colName = col.name.toLowerCase();
  const colType = col.type.toLowerCase();

  if (col.is_primary_key) {
    if (colType.includes('uuid')) {
      const hashes = ['a1b2c3d4', 'e5f6a7b8', 'c9d0e1f2', 'b3c4d5e6', 'f7a8b9c0'];
      return `${colName.replace('_id', '').replace('id', 'pk')}_${hashes[rowIndex % hashes.length]}`;
    }
    return `${rowIndex + 1}`;
  }

  if (col.is_foreign_key || colName.endsWith('_id')) {
    const ref = colName.replace('_id', '');
    return `${ref}_00${rowIndex + 1}`;
  }

  if (colName.includes('email')) {
    const emails = ['alex.turner@company.com', 'priya.sharma@startup.io', 'jordan.lee@dev.org', 'sam.wilson@domain.co', 'morgan.t@design.net'];
    return emails[rowIndex % emails.length];
  }
  if (colName.includes('name') || colName.includes('title')) {
    const names = ['Alex Turner', 'Priya Sharma', 'Jordan Lee', 'Sam Wilson', 'Morgan Taylor'];
    return names[rowIndex % names.length];
  }
  if (colName.includes('role')) {
    const roles = ['admin', 'moderator', 'editor', 'member', 'viewer'];
    return roles[rowIndex % roles.length];
  }
  if (colName.includes('status')) {
    const statuses = ['active', 'pending', 'verified', 'archived', 'processing'];
    return statuses[rowIndex % statuses.length];
  }
  if (colName.includes('price') || colName.includes('amount')) {
    const prices = ['$29.00', '$99.50', '$149.00', '$49.99', '$199.00'];
    return prices[rowIndex % prices.length];
  }
  if (colName.includes('quantity') || colName.includes('count')) {
    return `${(rowIndex + 1) * 2}`;
  }
  if (colType.includes('bool')) {
    return rowIndex % 2 === 0 ? 'true' : 'false';
  }
  if (colType.includes('int')) {
    return `${(rowIndex + 1) * 10}`;
  }
  if (colType.includes('time') || colType.includes('date')) {
    return `2026-11-0${rowIndex + 1} 14:30 UTC`;
  }
  return `Sample ${col.name} ${rowIndex + 1}`;
}

/**
 * SampleDataModal Component
 * Grounded in: karta_design_system.md
 *
 * Provides:
 * 1. Clean Karta forest theme header with table name & column count
 * 2. High-readability table cells with clean sans-serif typography
 * 3. Inline record editor & row adder
 * 4. Deterministic CSV export & download
 */
export const SampleDataModal: React.FC<SampleDataModalProps> = ({
  tableName,
  columns,
  isOpen,
  onClose,
}) => {
  const initialRows = useMemo(() => {
    return [0, 1, 2, 3, 4].map((rowIndex) => {
      const row: Record<string, string> = {};
      columns.forEach((col) => {
        row[col.name] = generateReadableMockValue(col, rowIndex);
      });
      return row;
    });
  }, [columns]);

  const [rows, setRows] = useState<Array<Record<string, string>>>(initialRows);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  React.useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  if (!isOpen) return null;

  const handleCellChange = (rowIndex: number, colName: string, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [colName]: value };
      return updated;
    });
  };

  const handleAddRow = () => {
    const newRow: Record<string, string> = {};
    columns.forEach((col) => {
      newRow[col.name] = generateReadableMockValue(col, rows.length);
    });
    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  const handleDownloadCsv = () => {
    const headerLine = columns.map((c) => `"${c.name}"`).join(',');
    const rowLines = rows.map((r) =>
      columns.map((c) => `"${r[c.name] ?? ''}"`).join(',')
    );
    const csvContent = [headerLine, ...rowLines].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableName}_sample_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  {tableName}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {columns.length} columns
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Sample preview records for schema modeling & CSV generation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Edit Mode */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isEditing
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </>
              )}
            </button>

            {/* Download CSV */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Table Body */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 select-none">
                  <th className="py-3 px-3.5 w-12 text-center font-bold text-gray-400 border-r border-gray-200">
                    #
                  </th>
                  {columns.map((col) => (
                    <th key={col.name} className="py-2.5 px-4 font-semibold text-gray-800 border-r border-gray-200 last:border-r-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[13px] text-gray-900 tracking-tight">{col.name}</span>
                        {col.is_primary_key && (
                          <span className="text-[9.5px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold border border-amber-200">
                            PK
                          </span>
                        )}
                        {col.is_foreign_key && (
                          <span className="text-[9.5px] bg-blue-100 text-blue-900 px-1 py-0.2 rounded font-bold border border-blue-200">
                            FK
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">
                        {col.type}
                      </div>
                    </th>
                  ))}
                  {isEditing && (
                    <th className="py-2.5 px-3 w-12 text-center font-bold text-gray-400">
                      Act
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length > 0 ? (
                  rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-emerald-50/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-gray-400 font-medium text-xs border-r border-gray-200 bg-gray-50/40">
                        {rIdx + 1}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.name}
                          className="py-2 px-4 text-gray-800 text-[12.5px] border-r border-gray-200 last:border-r-0 font-sans"
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={row[col.name] ?? ''}
                              onChange={(e) =>
                                handleCellChange(rIdx, col.name, e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                            />
                          ) : (
                            <span className="truncate block max-w-xs font-normal">
                              {row[col.name] || (
                                <span className="text-gray-300 italic">(null)</span>
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                      {isEditing && (
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rIdx)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length + (isEditing ? 2 : 1)}
                      className="py-8 text-center text-xs text-gray-400 italic"
                    >
                      No records in this table preview.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Row Button in Edit Mode */}
          {isEditing && (
            <div className="mt-3 flex justify-start">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Record Row</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
          <span>{rows.length} sample rows ready for export</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleDataModal;
