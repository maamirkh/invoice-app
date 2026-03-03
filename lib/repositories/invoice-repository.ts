import { getDb } from '@/lib/db';
import { Invoice, InvoiceItem, InvoiceWithItems } from '@/lib/types';
import { v4 as uuid } from 'uuid';

export class InvoiceRepository {
  generateInvoiceNumber(): string {
    const db = getDb();
    const year = new Date().getFullYear();

    const result = db.transaction(() => {
      const row = db.prepare(
        'SELECT last_number FROM invoice_counter WHERE year = ?'
      ).get(year) as { last_number: number } | undefined;

      let nextNumber: number;
      if (row) {
        nextNumber = row.last_number + 1;
        db.prepare(
          'UPDATE invoice_counter SET last_number = ? WHERE year = ?'
        ).run(nextNumber, year);
      } else {
        nextNumber = 1;
        db.prepare(
          'INSERT INTO invoice_counter (year, last_number) VALUES (?, ?)'
        ).run(year, nextNumber);
      }

      return `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
    })();

    return result;
  }

  create(data: {
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
  }): InvoiceWithItems {
    const db = getDb();

    const invoice = db.transaction(() => {
      const invoiceId = uuid();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO invoices (id, invoice_number, date, salesman_name, customer_name, customer_address, customer_phone, subtotal, tax_amount, grand_total, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId, data.invoice_number, data.date, data.salesman_name,
        data.customer_name, data.customer_address, data.customer_phone || '',
        data.subtotal, data.tax_amount, data.grand_total, now, now
      );

      const insertItem = db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const items: InvoiceItem[] = data.items.map((item) => {
        const itemId = uuid();
        insertItem.run(itemId, invoiceId, item.description, item.quantity, item.unit_price, item.total);
        return {
          id: itemId,
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        };
      });

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
    })();

    return invoice;
  }

  findAll(): Invoice[] {
    const db = getDb();
    return db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all() as Invoice[];
  }

  findById(id: string): InvoiceWithItems | null {
    const db = getDb();
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as Invoice | undefined;
    if (!invoice) return null;

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id) as InvoiceItem[];
    return { ...invoice, items };
  }

  update(id: string, data: {
    date: string;
    salesman_name: string;
    customer_name: string;
    customer_address: string;
    customer_phone: string;
    subtotal: number;
    tax_amount: number;
    grand_total: number;
    items: { description: string; quantity: number; unit_price: number; total: number }[];
  }): InvoiceWithItems | null {
    const db = getDb();

    const result = db.transaction(() => {
      const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as Invoice | undefined;
      if (!existing) return null;

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE invoices SET date = ?, salesman_name = ?, customer_name = ?, customer_address = ?, customer_phone = ?, subtotal = ?, tax_amount = ?, grand_total = ?, updated_at = ?
        WHERE id = ?
      `).run(
        data.date, data.salesman_name, data.customer_name, data.customer_address,
        data.customer_phone || '', data.subtotal, data.tax_amount, data.grand_total, now, id
      );

      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);

      const insertItem = db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const items: InvoiceItem[] = data.items.map((item) => {
        const itemId = uuid();
        insertItem.run(itemId, id, item.description, item.quantity, item.unit_price, item.total);
        return { id: itemId, invoice_id: id, ...item };
      });

      return {
        ...existing,
        ...data,
        customer_phone: data.customer_phone || '',
        updated_at: now,
        items,
      };
    })();

    return result;
  }

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const invoiceRepository = new InvoiceRepository();
