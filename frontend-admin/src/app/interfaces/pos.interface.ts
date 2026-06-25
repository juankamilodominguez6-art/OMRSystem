export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'guest';
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
  sort_order: number;
  active: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  code?: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  track_stock: boolean;
  active: boolean;
}

export interface Customer {
  id: number;
  dni?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  credit_limit: number;
  credit_used: number;
  active: boolean;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface Sale {
  id: number;
  user_id: number;
  customer_id?: number;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  payment_method: 'cash' | 'card' | 'credit' | 'transfer';
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  price: number;
  cost: number;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface CashRegisterSession {
  id: number;
  user_id: number;
  date: string;
  opening_balance: number;
  closing_balance?: number;
  sales_total: number;
  cash_payments: number;
  card_payments: number;
  credit_payments: number;
  transfer_payments: number;
  total_in: number;
  total_out: number;
  tax_total: number;
  status: 'open' | 'closed';
}

export interface Settings {
  id: number;
  business_name: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_tax_id?: string;
  receipt_header?: string;
  receipt_footer?: string;
  printer_width: '58mm' | '76mm' | '80mm';
  currency_symbol: string;
  currency_code: string;
  tax_rate: number;
}
