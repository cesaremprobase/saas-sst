export type Shift = 'MORNING' | 'AFTERNOON';
export type TransactionType = 'DELIVERY' | 'PAYMENT';

export interface Client {
  id: string;
  name: string;
  route?: string;
  order_index?: number;
  phone?: string;
  initial_balance?: number;
  created_at?: string;
  user_id: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface Transaction {
  id: string;
  client_id: string;
  type: TransactionType;
  shift?: Shift;
  amount: number;
  description?: string;
  date: string;
  created_at?: string;
  user_id: string;
  client?: Client; // Join
  products?: Record<string, number>; // e.g. { PAN: 10, MOLDE: 2 }
  items?: { quantity: number; product_name: string; price?: number }[]; // Relation
}

export interface DailyStats {
  date: string;
  total_delivered: number;
  total_paid: number;
  pending_balance: number;
}
