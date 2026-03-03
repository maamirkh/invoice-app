import { invoiceRepository } from '@/lib/repositories/invoice-repository';
import { CreateInvoiceDTO, UpdateInvoiceDTO, InvoiceWithItems, Invoice } from '@/lib/types';

export class InvoiceService {
  create(dto: CreateInvoiceDTO): InvoiceWithItems {
    const items = dto.items.map((item) => ({
      ...item,
      total: Math.round(item.quantity * item.unit_price * 100) / 100,
    }));

    const subtotal = Math.round(items.reduce((sum, i) => sum + i.total, 0) * 100) / 100;
    const tax_amount = Math.round(dto.tax_amount * 100) / 100;
    const grand_total = Math.round((subtotal + tax_amount) * 100) / 100;

    const invoice_number = invoiceRepository.generateInvoiceNumber();

    return invoiceRepository.create({
      invoice_number,
      date: dto.date,
      salesman_name: dto.salesman_name,
      customer_name: dto.customer_name,
      customer_address: dto.customer_address,
      customer_phone: dto.customer_phone || '',
      subtotal,
      tax_amount,
      grand_total,
      items,
    });
  }

  getAll(): Invoice[] {
    return invoiceRepository.findAll();
  }

  getById(id: string): InvoiceWithItems | null {
    return invoiceRepository.findById(id);
  }

  update(dto: UpdateInvoiceDTO): InvoiceWithItems | null {
    const items = dto.items.map((item) => ({
      ...item,
      total: Math.round(item.quantity * item.unit_price * 100) / 100,
    }));

    const subtotal = Math.round(items.reduce((sum, i) => sum + i.total, 0) * 100) / 100;
    const tax_amount = Math.round(dto.tax_amount * 100) / 100;
    const grand_total = Math.round((subtotal + tax_amount) * 100) / 100;

    return invoiceRepository.update(dto.id, {
      date: dto.date,
      salesman_name: dto.salesman_name,
      customer_name: dto.customer_name,
      customer_address: dto.customer_address,
      customer_phone: dto.customer_phone || '',
      subtotal,
      tax_amount,
      grand_total,
      items,
    });
  }

  delete(id: string): boolean {
    return invoiceRepository.delete(id);
  }

  validate(dto: CreateInvoiceDTO): string[] {
    const errors: string[] = [];

    if (!dto.date) errors.push('Date is required');
    if (!dto.salesman_name) errors.push('Salesman is required');
    if (!dto.customer_name) errors.push('Customer name is required');
    if (!dto.customer_address) errors.push('Customer address is required');
    if (!dto.items || dto.items.length === 0) errors.push('At least one item is required');

    dto.items?.forEach((item, i) => {
      if (!item.description) errors.push(`Item ${i + 1}: Description is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${i + 1}: Quantity must be positive`);
      if (!item.unit_price || item.unit_price < 0) errors.push(`Item ${i + 1}: Unit price must be non-negative`);
    });

    if (dto.tax_amount < 0) errors.push('Tax amount cannot be negative');

    return errors;
  }
}

export const invoiceService = new InvoiceService();
