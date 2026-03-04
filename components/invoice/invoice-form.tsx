'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SALESMEN, CreateInvoiceDTO, InvoiceWithItems } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ItemTable } from './item-table';

interface InvoiceFormProps {
  invoice?: InvoiceWithItems;
}

interface FormItem {
  key: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const isEditing = !!invoice;

  const [salesman, setSalesman] = useState(invoice?.salesman_name || '');
  const [customerName, setCustomerName] = useState(invoice?.customer_name || '');
  const [customerAddress, setCustomerAddress] = useState(invoice?.customer_address || '');
  const [customerPhone, setCustomerPhone] = useState(invoice?.customer_phone || '');
  const [date, setDate] = useState<string>(invoice?.date ?? '');
  const [taxAmount, setTaxAmount] = useState(invoice?.tax_amount || 0);
  const [items, setItems] = useState<FormItem[]>(
    invoice?.items.map((i, idx) => ({
      key: `item-${idx}`,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })) || [{ key: 'item-0', description: '', quantity: 1, unit_price: 0 }]
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Set today's date on client only (avoids SSR hydration mismatch)
  useEffect(() => {
    if (!invoice?.date) {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  const subtotal = useMemo(
    () => Math.round(items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0) * 100) / 100,
    [items]
  );

  const grandTotal = useMemo(
    () => Math.round((subtotal + taxAmount) * 100) / 100,
    [subtotal, taxAmount]
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { key: `item-${Date.now()}`, description: '', quantity: 1, unit_price: 0 }]);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  }, []);

  const updateItem = useCallback((key: string, field: keyof Omit<FormItem, 'key'>, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i))
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);

    const dto: CreateInvoiceDTO = {
      date,
      salesman_name: salesman,
      customer_name: customerName,
      customer_address: customerAddress,
      customer_phone: customerPhone,
      tax_amount: taxAmount,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    };

    try {
      const url = isEditing ? `/api/invoices/${invoice.id}` : '/api/invoices';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors(data.errors || [data.error || 'Failed to save invoice']);
        return;
      }

      const saved = await res.json();
      router.push(`/invoices/${saved.id}`);
      router.refresh();
    } catch {
      setErrors(['Network error. Please try again.']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Invoice Info */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person</label>
            <select
              value={salesman}
              onChange={(e) => setSalesman(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Select salesperson...</option>
              {SALESMEN.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="customerName"
            label="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Enter customer name"
          />
          <Input
            id="customerPhone"
            label="Phone (Optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Enter phone number"
          />
          <div className="md:col-span-2">
            <Input
              id="customerAddress"
              label="Address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              required
              placeholder="Enter customer address"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Items</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            + Add Item
          </Button>
        </div>
        <ItemTable items={items} onUpdate={updateItem} onRemove={removeItem} />
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="w-full sm:max-w-xs ml-auto space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">Rs {subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Tax</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxAmount}
              onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
              className="w-32 text-right border border-gray-300 rounded-md px-2 py-1 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="border-t pt-3 flex justify-between text-base font-bold">
            <span className="text-gray-900">Grand Total</span>
            <span className="text-blue-600">Rs {grandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
