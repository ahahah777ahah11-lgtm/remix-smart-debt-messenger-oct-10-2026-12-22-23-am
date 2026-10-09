export interface Transaction {
  id: string;
  date: string;
  type: 'debit' | 'credit'; // debit = عليه (مشتريات/دين جديد), credit = له (سداد/دفعة)
  amount: number;
  note: string;
  receiptNumber?: string;
}

export type CustomerStatus = 'unnotified' | 'sent' | 'postponed' | 'exempt';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  debit: number; // المبلغ الذي عليه (مدين)
  credit: number; // المبلغ الذي له (دائن)
  balance: number; // صافي الرصيد = debit - credit (إذا كان موجباً فالعميل مدين)
  notes?: string;
  category?: string; // تصنيف العميل
  accountNumber?: string;
  status: CustomerStatus; // حالة الإرسال
  lastSentAt?: string | null;
  lastSentChannel?: 'sms' | 'whatsapp' | null;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface SendLogEntry {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  amount: number;
  messageText: string;
  channel: 'sms' | 'whatsapp';
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface AppSettings {
  storeName: string;
  storePhone: string;
  currency: string;
  countryCode: string;
  autoFormatPhone: boolean;
}

export interface SqliteTableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

export interface ColumnMapping {
  nameCol: string;
  phoneCol: string;
  debitCol: string;
  creditCol: string;
  balanceCol: string;
  notesCol?: string;
  accountNumberCol?: string;
}
