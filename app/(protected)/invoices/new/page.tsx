import { InvoiceForm } from '@/components/invoice/invoice-form';

export default function NewInvoicePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-gray-500 mt-1">Fill in the details to create a new invoice</p>
      </div>
      <InvoiceForm />
    </div>
  );
}
