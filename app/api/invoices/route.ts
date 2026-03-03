import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/lib/services/invoice-service';
import { CreateInvoiceDTO } from '@/lib/types';

export async function GET() {
  try {
    const invoices = invoiceService.getAll();
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateInvoiceDTO = await request.json();

    const errors = invoiceService.validate(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const invoice = invoiceService.create(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
