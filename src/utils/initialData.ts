import { AppSettings, Customer, SmsTemplate } from '../types';
import { DEFAULT_TEMPLATES } from './smsHelper';

export const INITIAL_SETTINGS: AppSettings = {
  storeName: 'مركز الأمل للتجارة والخدمات',
  storePhone: '777000000',
  currency: 'ريال يمني',
  countryCode: '+967',
  autoFormatPhone: true
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_init_1',
    name: 'عادل حزام اليافعي',
    phone: '777123456',
    debit: 85000,
    credit: 15000,
    balance: 70000,
    notes: 'حساب توريدات بقالة ومواد غذائية لشهر فبراير',
    category: 'عميل مميز',
    accountNumber: 'ACC-101',
    status: 'unnotified',
    lastSentAt: null,
    lastSentChannel: null,
    transactions: [
      {
        id: 'tx_1_1',
        date: '2026-03-01',
        type: 'debit',
        amount: 85000,
        note: 'فاتورة مبيعات بضائع رقم 1042',
        receiptNumber: 'INV-1042'
      },
      {
        id: 'tx_1_2',
        date: '2026-03-12',
        type: 'credit',
        amount: 15000,
        note: 'سند قبض نقدي رقم 55',
        receiptNumber: 'REC-55'
      }
    ],
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-12T11:00:00.000Z'
  },
  {
    id: 'cust_init_2',
    name: 'محمد عبدالله الصنعاني',
    phone: '771987654',
    debit: 120000,
    credit: 40000,
    balance: 80000,
    notes: 'فواتير مشتريات وتجهيزات المحل الجديد',
    category: 'عميل جملة',
    accountNumber: 'ACC-102',
    status: 'unnotified',
    lastSentAt: null,
    lastSentChannel: null,
    transactions: [
      {
        id: 'tx_2_1',
        date: '2026-03-05',
        type: 'debit',
        amount: 120000,
        note: 'شراء بضاعة بالآجل',
        receiptNumber: 'INV-1050'
      },
      {
        id: 'tx_2_2',
        date: '2026-03-18',
        type: 'credit',
        amount: 40000,
        note: 'حوالة مصرفية حساب الكريمي',
        receiptNumber: 'TRF-889'
      }
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
    updatedAt: '2026-03-18T14:30:00.000Z'
  },
  {
    id: 'cust_init_3',
    name: 'أحمد علي القدسي',
    phone: '733456789',
    debit: 45000,
    credit: 45000,
    balance: 0,
    notes: 'تم تصفية الحساب بالكامل نقداً',
    category: 'عميل منتظم',
    accountNumber: 'ACC-103',
    status: 'sent',
    lastSentAt: '2026-03-20T09:15:00.000Z',
    lastSentChannel: 'sms',
    transactions: [
      {
        id: 'tx_3_1',
        date: '2026-03-10',
        type: 'debit',
        amount: 45000,
        note: 'فاتورة رقم 1080',
        receiptNumber: 'INV-1080'
      },
      {
        id: 'tx_3_2',
        date: '2026-03-20',
        type: 'credit',
        amount: 45000,
        note: 'سداد كامل الحساب',
        receiptNumber: 'REC-76'
      }
    ],
    createdAt: '2026-03-10T08:00:00.000Z',
    updatedAt: '2026-03-20T09:15:00.000Z'
  },
  {
    id: 'cust_init_4',
    name: 'خالد عبده الحكيمي',
    phone: '770112233',
    debit: 195000,
    credit: 25000,
    balance: 170000,
    notes: 'متبقي حساب أجهزة كهربائية وطاقة شمسية',
    category: 'عميل آجل',
    accountNumber: 'ACC-104',
    status: 'unnotified',
    lastSentAt: null,
    lastSentChannel: null,
    transactions: [
      {
        id: 'tx_4_1',
        date: '2026-02-28',
        type: 'debit',
        amount: 195000,
        note: 'شراء بطاريات والواح شمسية',
        receiptNumber: 'INV-990'
      },
      {
        id: 'tx_4_2',
        date: '2026-03-14',
        type: 'credit',
        amount: 25000,
        note: 'دفعة أولى',
        receiptNumber: 'REC-62'
      }
    ],
    createdAt: '2026-02-28T16:00:00.000Z',
    updatedAt: '2026-03-14T10:00:00.000Z'
  },
  {
    id: 'cust_init_5',
    name: 'طارق حسن العدني',
    phone: '773665544',
    debit: 32000,
    credit: 0,
    balance: 32000,
    notes: 'وعد بالسداد نهاية الأسبوع الحالي',
    category: 'عميل منتظم',
    accountNumber: 'ACC-105',
    status: 'unnotified',
    lastSentAt: null,
    lastSentChannel: null,
    transactions: [
      {
        id: 'tx_5_1',
        date: '2026-03-15',
        type: 'debit',
        amount: 32000,
        note: 'مشتريات متنوعة',
        receiptNumber: 'INV-1110'
      }
    ],
    createdAt: '2026-03-15T11:00:00.000Z',
    updatedAt: '2026-03-15T11:00:00.000Z'
  },
  {
    id: 'cust_init_6',
    name: 'صالح ناصر المهري',
    phone: '775889900',
    debit: 0,
    credit: 15000,
    balance: -15000,
    notes: 'دائن - له رصيد متبقي لدينا ناتج عن إرجاع بضاعة',
    category: 'عميل دائن',
    accountNumber: 'ACC-106',
    status: 'exempt',
    lastSentAt: null,
    lastSentChannel: null,
    transactions: [
      {
        id: 'tx_6_1',
        date: '2026-03-16',
        type: 'credit',
        amount: 15000,
        note: 'مردودات مبيعات - رصيد للعميل',
        receiptNumber: 'RET-12'
      }
    ],
    createdAt: '2026-03-16T15:00:00.000Z',
    updatedAt: '2026-03-16T15:00:00.000Z'
  },
  {
    id: 'cust_init_7',
    name: 'يوسف سعيد التعزي',
    phone: '772334455',
    debit: 68000,
    credit: 18000,
    balance: 50000,
    notes: 'مستلزمات صيانة ومواد بناء',
    category: 'عميل آجل',
    accountNumber: 'ACC-107',
    status: 'unnotified',
    lastSentAt: null,
    lastSentChannel: null,
    transactions: [
      {
        id: 'tx_7_1',
        date: '2026-03-08',
        type: 'debit',
        amount: 68000,
        note: 'فاتورة مواد صيانة',
        receiptNumber: 'INV-1065'
      },
      {
        id: 'tx_7_2',
        date: '2026-03-19',
        type: 'credit',
        amount: 18000,
        note: 'دفعة سداد نقدية',
        receiptNumber: 'REC-71'
      }
    ],
    createdAt: '2026-03-08T09:00:00.000Z',
    updatedAt: '2026-03-19T13:00:00.000Z'
  },
  {
    id: 'cust_init_8',
    name: 'فهد عبدالكريم المأربي',
    phone: '774998877',
    debit: 240000,
    credit: 50000,
    balance: 190000,
    notes: 'مورد وتاجر تجزئة - دفعة شيك مستحقة',
    category: 'عميل جملة',
    accountNumber: 'ACC-108',
    status: 'unnotified',
    lastSentAt: null,
    lastSentChannel: null,
    transactions: [
      {
        id: 'tx_8_1',
        date: '2026-02-20',
        type: 'debit',
        amount: 240000,
        note: 'فاتورة بضاعة جملة',
        receiptNumber: 'INV-950'
      },
      {
        id: 'tx_8_2',
        date: '2026-03-10',
        type: 'credit',
        amount: 50000,
        note: 'دفعة شيك مصرفي',
        receiptNumber: 'CHK-331'
      }
    ],
    createdAt: '2026-02-20T11:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z'
  }
];
