'use client';

import { memo, useCallback } from 'react';

interface FormItem {
  key: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface ItemTableProps {
  items: FormItem[];
  onUpdate: (key: string, field: keyof Omit<FormItem, 'key'>, value: string | number) => void;
  onRemove: (key: string) => void;
}

const ItemRow = memo(function ItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: FormItem;
  index: number;
  onUpdate: (key: string, field: keyof Omit<FormItem, 'key'>, value: string | number) => void;
  onRemove: (key: string) => void;
  canRemove: boolean;
}) {
  const total = Math.round(item.quantity * item.unit_price * 100) / 100;

  const handleDescChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(item.key, 'description', e.target.value),
    [item.key, onUpdate]
  );
  const handleQtyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(item.key, 'quantity', parseFloat(e.target.value) || 0),
    [item.key, onUpdate]
  );
  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(item.key, 'unit_price', parseFloat(e.target.value) || 0),
    [item.key, onUpdate]
  );
  const handleRemove = useCallback(() => onRemove(item.key), [item.key, onRemove]);

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-2 text-sm text-gray-500 w-10">{index + 1}</td>
      <td className="py-2 pr-2">
        <input
          type="text"
          value={item.description}
          onChange={handleDescChange}
          required
          placeholder="Item description"
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </td>
      <td className="py-2 pr-2 w-24">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={item.quantity || ''}
          onChange={handleQtyChange}
          required
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </td>
      <td className="py-2 pr-2 w-32">
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unit_price || ''}
          onChange={handlePriceChange}
          required
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </td>
      <td className="py-2 pr-2 w-32 text-right text-sm font-medium text-gray-900">
        Rs {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
      </td>
      <td className="py-2 w-10">
        <button
          type="button"
          onClick={handleRemove}
          disabled={!canRemove}
          className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
});

export function ItemTable({ items, onUpdate, onRemove }: ItemTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2 pr-2 w-10">#</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2 pr-2">Description</th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2 pr-2 w-24">Qty</th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2 pr-2 w-32">Unit Price</th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2 pr-2 w-32">Total</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <ItemRow
              key={item.key}
              item={item}
              index={index}
              onUpdate={onUpdate}
              onRemove={onRemove}
              canRemove={items.length > 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
