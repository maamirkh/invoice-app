-- Run this in your Neon SQL Editor to initialize the database

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  salesman_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  grand_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_counter (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
