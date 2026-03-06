import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import { InvoiceWithItems, COMPANY, TERMS_AND_CONDITIONS } from '@/lib/types';
import fs from 'fs';
import path from 'path';

function generateBarcodePng(value: string): string {
  const canvas = createCanvas(300, 80);
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: false,
    margin: 5,
    background: '#ffffff',
    lineColor: '#000000',
  });
  return canvas.toDataURL('image/png');
}

function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpeg');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(invoice: InvoiceWithItems): Promise<Buffer> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // ── Logo (top-left) ──
  const logoBase64 = getLogoBase64();
  if (logoBase64) {
    doc.addImage(logoBase64, 'JPEG', margin, y, 25, 25);
  }

  // ── Company info (next to logo) ──
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(COMPANY.name, margin + 30, y + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY.address, margin + 30, y + 12);
  doc.text(`Phone: ${COMPANY.phone}`, margin + 30, y + 17);
  doc.text(`Email: ${COMPANY.email}`, margin + 30, y + 22);

  // ── INVOICE title (right side) ──
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('INVOICE', pageWidth - margin, y + 6, { align: 'right' });

  // ── Invoice Number & Date (right side) ──
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`# ${invoice.invoice_number}`, pageWidth - margin, y + 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${invoice.date}`, pageWidth - margin, y + 20, { align: 'right' });

  // ── Barcode + Invoice Number (right side, below invoice info) ──
  y += 26;
  try {
    const barcodePng = generateBarcodePng(invoice.invoice_number);
    doc.addImage(barcodePng, 'PNG', pageWidth - margin - 58, y, 58, 14);
    y += 22; // 14mm barcode + 8mm gap (≈32px)

    // Invoice number below barcode bars
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(invoice.invoice_number, pageWidth - margin, y, { align: 'right' });
    y += 2; // ~1mm gap (≈4px) before divider line
  } catch (err) {
    console.error('Barcode generation failed:', err);
    y += 4;
  }

  // ── Divider ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Bill To + Sales Person ──
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('BILL TO', margin, y);
  doc.text('SALES PERSON', pageWidth / 2 + 10, y);
  y += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(invoice.customer_name, margin, y);
  doc.text(invoice.salesman_name, pageWidth / 2 + 10, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(invoice.customer_address, margin, y);
  y += 5;
  if (invoice.customer_phone) {
    doc.text(invoice.customer_phone, margin, y);
    y += 5;
  }

  y += 5;

  // ── Items Table ──
  const tableData = invoice.items.map((item, i) => [
    String(i + 1),
    item.description,
    String(item.quantity),
    `Rs ${item.unit_price.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
    `Rs ${item.total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [40, 40, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    theme: 'grid',
    styles: {
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
  });

  // ── Totals (right side) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalsX = pageWidth - margin - 70;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(`Rs ${invoice.subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  doc.setTextColor(100, 100, 100);
  doc.text('Tax', totalsX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(`Rs ${invoice.tax_amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });
  y += 3;

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.8);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Grand Total', totalsX, y);
  doc.text(`Rs ${invoice.grand_total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });

  // ── Terms & Conditions (below totals, width limited to grand total column) ──
  y += 12;
  const termsMaxWidth = totalsX - margin - 5;

  if (y > pageHeight - 80) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('TERMS & CONDITIONS', margin, y);
  y += 4;

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  TERMS_AND_CONDITIONS.forEach((term, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${term}`, termsMaxWidth);
    if (y + lines.length * 2.8 > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 2.8 + 1.2;
  });

  y += 4;

  // ── Footer ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(7);
  doc.text(
    `${COMPANY.name} | ${COMPANY.address} | ${COMPANY.phone}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
