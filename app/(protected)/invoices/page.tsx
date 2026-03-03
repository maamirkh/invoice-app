'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, invoiceNumber: string) {
    if (!confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      alert('Failed to delete invoice');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1 text-sm">{invoices.length} total invoices</p>
        </div>
        <Link
          href="/invoices/new"
          className="self-start sm:self-auto bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Create Invoice
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            No invoices found. Create your first invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Invoice #</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3 hidden sm:table-cell">Salesman</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Total</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3">
                      <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium text-sm">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{inv.date}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-900">{inv.customer_name}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{inv.salesman_name}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-right font-medium text-gray-900 whitespace-nowrap">
                      Rs {inv.grand_total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          className="text-xs px-2 sm:px-3"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/invoices/${inv.id}/edit`)}
                          className="text-xs px-2 sm:px-3"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(inv.id, inv.invoice_number)}
                          disabled={deleting === inv.id}
                          className="text-xs px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleting === inv.id ? '...' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
