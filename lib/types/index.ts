export interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  salesman_name: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  subtotal: number;
  tax_amount: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface CreateInvoiceDTO {
  date: string;
  salesman_name: string;
  customer_name: string;
  customer_address: string;
  customer_phone?: string;
  items: CreateInvoiceItemDTO[];
  tax_amount: number;
}

export interface CreateInvoiceItemDTO {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface UpdateInvoiceDTO extends CreateInvoiceDTO {
  id: string;
}

export interface SessionUser {
  name: string;
  username: string;
}

export const SALESMEN = ['Ahmed Ali', 'Owais Ahmed', 'Ubaid Raza'] as const;
export type Salesman = (typeof SALESMEN)[number];

export const COMPANY = {
  name: 'Perfect Power Energy',
  address: 'Address 11F New Karachi Pakistan',
  phone: '+92322 3749645',
  email: 'perfectpowerenergy786@gmail.com',
} as const;

export const TERMS_AND_CONDITIONS = [
  'All warranties are provided exclusively by the manufacturer/importer. Perfect Power Energy does not offer any separate or extended warranty.',
  'Warranty is void if the fault is due to improper installation, mishandling, accidents, negligence, theft, vandalism, fire, water damage, electrical surges, sag/brownouts, lightning, or unauthorized repair.',
  'Perfect Power Energy acts solely as a trading company and is not responsible for installation, integration, or system performance. Furthermore, Perfect Power Energy shall not be held liable for any financial or monetary loss arising directly or indirectly from the use, failure, or performance of the products supplied.',
  'Goods are considered delivered in full and in good condition once handed over to the buyer or their authorized transporter. Perfect Power Energy holds no liability for loss or damage in transit.',
  'No product is eligible for return or refund without prior written approval and confirmation of defect under manufacturer warranty.',
  'In case of non-payment, all warranties shall be void and legal action may be taken for recovery.',
  'All disputes are subject to the exclusive jurisdiction of courts at Karachi.',
  'Acceptance of goods or payment confirms agreement to these terms and conditions.',
  'Perfect Power Energy By MUHAMMAD YAQOOB ELECTRONICS Since (1968) Working in Electronics Field',
] as const;
