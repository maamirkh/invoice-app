'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InvoiceWithItems, COMPANY, TERMS_AND_CONDITIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Barcode } from '@/components/invoice/barcode';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setInvoice)
      .catch(() => router.push('/invoices'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!invoice) return;
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return;

    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/invoices');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
          <p className="text-gray-500 mt-1 text-sm">Invoice Details</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
          <a href={`/api/invoices/${id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">Download PDF</Button>
          </a>
          <Link href={`/invoices/${id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white rounded-lg shadow print:shadow-none" id="invoice-preview">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
            <div className="flex items-start gap-3">
              <img src="/logo.jpeg" alt="Logo" className="h-14 sm:h-20 object-contain shrink-0" />
              <div>
                <h2 className="text-base sm:text-xl font-bold text-gray-900">{COMPANY.name}</h2>
                <p className="text-xs sm:text-sm text-gray-600">{COMPANY.address}</p>
                <p className="text-xs sm:text-sm text-gray-600">{COMPANY.phone}</p>
                <p className="text-xs sm:text-sm text-gray-600">{COMPANY.email}</p>
              </div>
            </div>
            <div className="sm:text-right">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">INVOICE</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Invoice #:</span> {invoice.invoice_number}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Date:</span> {invoice.date}
              </p>
              <div className="mt-3">
                <Barcode value={invoice.invoice_number} height={40} width={1.5} />
              </div>
            </div>
          </div>

          {/* Customer + Salesman */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</h4>
              <p className="font-medium text-gray-900 text-sm sm:text-base">{invoice.customer_name}</p>
              <p className="text-xs sm:text-sm text-gray-600">{invoice.customer_address}</p>
              {invoice.customer_phone && (
                <p className="text-xs sm:text-sm text-gray-600">{invoice.customer_phone}</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sales Person</h4>
              <p className="font-medium text-gray-900 text-sm sm:text-base">{invoice.salesman_name}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6 sm:mb-8">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left text-xs font-semibold uppercase px-3 sm:px-4 py-3 rounded-tl">#</th>
                  <th className="text-left text-xs font-semibold uppercase px-3 sm:px-4 py-3">Description</th>
                  <th className="text-right text-xs font-semibold uppercase px-3 sm:px-4 py-3">Qty</th>
                  <th className="text-right text-xs font-semibold uppercase px-3 sm:px-4 py-3">Unit Price</th>
                  <th className="text-right text-xs font-semibold uppercase px-3 sm:px-4 py-3 rounded-tr">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-600">{i + 1}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900">{item.description}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-right text-gray-900">{item.quantity}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-right text-gray-900">
                      Rs {item.unit_price.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-right font-medium text-gray-900">
                      Rs {item.total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">Rs {invoice.subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">Rs {invoice.tax_amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800 text-base sm:text-lg font-bold">
                <span className="text-gray-900">Grand Total</span>
                <span className="text-blue-600">Rs {invoice.grand_total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-200 w-full sm:max-w-[calc(100%-18rem)]">
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Terms & Conditions</h4>
            <ol className="list-decimal list-outside pl-4 space-y-1.5">
              {TERMS_AND_CONDITIONS.map((term, i) => (
                <li key={i} className="text-[11px] leading-relaxed text-gray-600">
                  {term}
                </li>
              ))}
            </ol>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">Thank you for your business!</p>
            <p className="text-xs text-gray-400 mt-1">
              {COMPANY.name} | {COMPANY.address} | {COMPANY.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
