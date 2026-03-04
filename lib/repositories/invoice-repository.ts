import { sql } from '@/lib/db';
import { Invoice, InvoiceItem, InvoiceWithItems } from '@/lib/types';
import { v4 as uuid } from 'uuid';

export class InvoiceRepository {
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const rows = await sql`
      INSERT INTO invoice_counter (year, last_number)
      VALUES (${year}, 1)
      ON CONFLICT (year) DO UPDATE
        SET last_number = invoice_counter.last_number + 1
      RETURNING last_number
    `;
    const nextNumber = (rows[0] as { last_number: number }).last_number;
    return `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  async create(data: {
    invoice_number: string;
    date: string;
    salesman_name: string;
    customer_name: string;
    customer_address: string;
    customer_phone: string;
    subtotal: number;
    tax_amount: number;
    grand_total: number;
    items: { description: string; quantity: number; unit_price: number; total: number }[];
  }): Promise<InvoiceWithItems> {
    const invoiceId = uuid();
    const now = new Date().toISOString();

    const itemData = data.items.map((item) => ({ id: uuid(), ...item }));

    await sql.transaction([
      sql`
        INSERT INTO invoices (id, invoice_number, date, salesman_name, customer_name, customer_address, customer_phone, subtotal, tax_amount, grand_total, created_at, updated_at)
        VALUES (${invoiceId}, ${data.invoice_number}, ${data.date}, ${data.salesman_name}, ${data.customer_name}, ${data.customer_address}, ${data.customer_phone || ''}, ${data.subtotal}, ${data.tax_amount}, ${data.grand_total}, ${now}, ${now})
      `,
      ...itemData.map(
        (item) => sql`
          INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
          VALUES (${item.id}, ${invoiceId}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.total})
        `
      ),
    ]);

    const items: InvoiceItem[] = itemData.map((item) => ({
      id: item.id,
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    return {
      id: invoiceId,
      invoice_number: data.invoice_number,
      date: data.date,
      salesman_name: data.salesman_name,
      customer_name: data.customer_name,
      customer_address: data.customer_address,
      customer_phone: data.customer_phone || '',
      subtotal: data.subtotal,
      tax_amount: data.tax_amount,
      grand_total: data.grand_total,
      created_at: now,
      updated_at: now,
      items,
    };
  }

  async findAll(): Promise<Invoice[]> {
    const rows = await sql`SELECT * FROM invoices ORDER BY created_at DESC`;
    return rows as unknown as Invoice[];
  }

  async findById(id: string): Promise<InvoiceWithItems | null> {
    const invoices = await sql`SELECT * FROM invoices WHERE id = ${id}`;
    if (invoices.length === 0) return null;

    const items = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${id}`;
    return {
      ...(invoices[0] as unknown as Invoice),
      items: items as unknown as InvoiceItem[],
    };
  }

  async update(
    id: string,
    data: {
      date: string;
      salesman_name: string;
      customer_name: string;
      customer_address: string;
      customer_phone: string;
      subtotal: number;
      tax_amount: number;
      grand_total: number;
      items: { description: string; quantity: number; unit_price: number; total: number }[];
    }
  ): Promise<InvoiceWithItems | null> {
    const invoices = await sql`SELECT * FROM invoices WHERE id = ${id}`;
    if (invoices.length === 0) return null;

    const existing = invoices[0] as unknown as Invoice;
    const now = new Date().toISOString();
    const itemData = data.items.map((item) => ({ id: uuid(), ...item }));

    await sql.transaction([
      sql`
        UPDATE invoices
        SET date = ${data.date}, salesman_name = ${data.salesman_name}, customer_name = ${data.customer_name},
            customer_address = ${data.customer_address}, customer_phone = ${data.customer_phone || ''},
            subtotal = ${data.subtotal}, tax_amount = ${data.tax_amount}, grand_total = ${data.grand_total},
            updated_at = ${now}
        WHERE id = ${id}
      `,
      sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`,
      ...itemData.map(
        (item) => sql`
          INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
          VALUES (${item.id}, ${id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.total})
        `
      ),
    ]);

    const items: InvoiceItem[] = itemData.map((item) => ({
      id: item.id,
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    return {
      ...existing,
      ...data,
      customer_phone: data.customer_phone || '',
      updated_at: now,
      items,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM invoices WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  }
}

export const invoiceRepository = new InvoiceRepository();
