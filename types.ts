
export interface CompanyInfo {
  name: string;
  memoTitle: string;
  memoSubTitle: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  primaryColor: string;
  logo: string;
}

export interface ProductItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface CashMemo {
  id: string;
  customer: CustomerInfo;
  date: string;
  items: ProductItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: string;
  signature: string;
  timestamp: number;
}

export type AppView = 'setup' | 'dashboard' | 'create' | 'preview' | 'history';
