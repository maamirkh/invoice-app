'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoices, setShowInvoices] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/invoices')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);
  const thisMonth = invoices.filter(
    (inv) => inv.date.startsWith(new Date().toISOString().slice(0, 7))
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Overview of your invoice system</p>
        </div>
        <Link
          href="/invoices/new"
          className="self-start sm:self-auto bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Create Invoice
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-5 sm:p-6">
              <p className="text-sm text-gray-500">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{invoices.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 sm:p-6">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{thisMonth.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 sm:p-6">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                Rs {totalRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Invoices</h2>
              <button
                onClick={() => setShowInvoices((prev) => !prev)}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                {showInvoices ? 'Hide Invoices' : 'View Invoices'}
              </button>
            </div>

            {showInvoices && (
              invoices.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">
                  No invoices yet. Create your first invoice to get started.
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
                              <button
                                onClick={() => router.push(`/invoices/${inv.id}/edit`)}
                                className="text-xs px-2.5 sm:px-3 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium transition-colors whitespace-nowrap"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(inv.id, inv.invoice_number)}
                                disabled={deleting === inv.id}
                                className="text-xs px-2.5 sm:px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {deleting === inv.id ? '...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
