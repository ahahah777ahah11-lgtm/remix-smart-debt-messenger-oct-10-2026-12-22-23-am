import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppSettings,
  Customer,
  CustomerStatus,
  SendLogEntry,
  SmsTemplate,
  Transaction
} from '../types';
import { INITIAL_CUSTOMERS, INITIAL_SETTINGS } from '../utils/initialData';
import { DEFAULT_TEMPLATES } from '../utils/smsHelper';

interface AppContextType {
  customers: Customer[];
  templates: SmsTemplate[];
  settings: AppSettings;
  logs: SendLogEntry[];
  selectedCustomerIds: string[];

  // Statistics
  totalDebtorsCount: number;
  totalCreditorsCount: number;
  totalSettledCount: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  netTotalDebt: number;
  sentDebtorsCount: number;
  pendingDebtorsCount: number;

  // Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'transactions'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  importCustomers: (newCustomers: Customer[], mode: 'replace' | 'merge') => void;
  addTransaction: (customerId: string, tx: Omit<Transaction, 'id'>) => void;
  updateCustomerStatus: (customerId: string, status: CustomerStatus, channel?: 'sms' | 'whatsapp') => void;
  recordSendLog: (log: Omit<SendLogEntry, 'id' | 'timestamp'>) => void;
  
  // Selection
  toggleSelectCustomer: (id: string) => void;
  selectAllDebtors: () => void;
  selectAllFiltered: (ids: string[]) => void;
  deselectAll: () => void;
  
  // Templates & Settings
  saveTemplate: (template: SmsTemplate) => void;
  deleteTemplate: (id: string) => void;
  setDefaultTemplate: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Reset
  resetToSampleData: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  CUSTOMERS: 'adel_debt_customers_v1',
  TEMPLATES: 'adel_debt_templates_v1',
  SETTINGS: 'adel_debt_settings_v1',
  LOGS: 'adel_debt_logs_v1'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [templates, setTemplates] = useState<SmsTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [logs, setLogs] = useState<SendLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers to storage', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      console.error('Failed to save templates', e);
    }
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs', e);
    }
  }, [logs]);

  // Calculations
  const debtors = customers.filter((c) => c.balance > 0);
  const totalDebtorsCount = debtors.length;
  const totalCreditorsCount = customers.filter((c) => c.balance < 0).length;
  const totalSettledCount = customers.filter((c) => c.balance === 0).length;

  const totalDebitAmount = customers.reduce((sum, c) => sum + (c.debit || 0), 0);
  const totalCreditAmount = customers.reduce((sum, c) => sum + (c.credit || 0), 0);
  const netTotalDebt = debtors.reduce((sum, c) => sum + c.balance, 0);

  const sentDebtorsCount = debtors.filter((c) => c.status === 'sent').length;
  const pendingDebtorsCount = debtors.filter((c) => c.status === 'unnotified').length;

  // Actions
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'transactions'>) => {
    const now = new Date().toISOString();
    const balance = customerData.debit - customerData.credit;
    const newCust: Customer = {
      ...customerData,
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      balance,
      transactions: customerData.debit > 0 ? [
        {
          id: `tx_${Date.now()}`,
          date: now.split('T')[0],
          type: 'debit',
          amount: customerData.debit,
          note: 'رصيد افتتاحي'
        }
      ] : [],
      createdAt: now,
      updatedAt: now
    };

    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newDebit = updates.debit !== undefined ? updates.debit : c.debit;
        const newCredit = updates.credit !== undefined ? updates.credit : c.credit;
        const newBalance = updates.balance !== undefined ? updates.balance : (newDebit - newCredit);

        return {
          ...c,
          ...updates,
          debit: newDebit,
          credit: newCredit,
          balance: newBalance,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setSelectedCustomerIds((prev) => prev.filter((cid) => cid !== id));
  };

  const importCustomers = (newCustomers: Customer[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setCustomers(newCustomers);
      setSelectedCustomerIds([]);
    } else {
      // Merge by phone or name
      setCustomers((prev) => {
        const existingPhones = new Set(prev.map((c) => c.phone).filter(Boolean));
        const nonDuplicates = newCustomers.filter((c) => !c.phone || !existingPhones.has(c.phone));
        return [...prev, ...nonDuplicates];
      });
    }
  };

  const addTransaction = (customerId: string, tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const updatedTransactions = [newTx, ...c.transactions];
        let newDebit = c.debit;
        let newCredit = c.credit;

        if (tx.type === 'debit') {
          newDebit += tx.amount;
        } else {
          newCredit += tx.amount;
        }

        const newBalance = newDebit - newCredit;

        return {
          ...c,
          debit: newDebit,
          credit: newCredit,
          balance: newBalance,
          transactions: updatedTransactions,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const updateCustomerStatus = (customerId: string, status: CustomerStatus, channel?: 'sms' | 'whatsapp') => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          status,
          lastSentAt: status === 'sent' ? now : c.lastSentAt,
          lastSentChannel: channel || c.lastSentChannel,
          updatedAt: now
        };
      })
    );
  };

  const recordSendLog = (entry: Omit<SendLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: SendLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllDebtors = () => {
    const debtorIds = customers.filter((c) => c.balance > 0).map((c) => c.id);
    setSelectedCustomerIds(debtorIds);
  };

  const selectAllFiltered = (ids: string[]) => {
    setSelectedCustomerIds(ids);
  };

  const deselectAll = () => {
    setSelectedCustomerIds([]);
  };

  const saveTemplate = (template: SmsTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === template.id);
      if (exists) {
        return prev.map((t) => (t.id === template.id ? template : t));
      }
      return [...prev, template];
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const setDefaultTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        isDefault: t.id === id
      }))
    );
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToSampleData = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setTemplates(DEFAULT_TEMPLATES);
    setSettings(INITIAL_SETTINGS);
    setLogs([]);
    setSelectedCustomerIds([]);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  };

  const clearAllData = () => {
    setCustomers([]);
    setSelectedCustomerIds([]);
    setLogs([]);
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        templates,
        settings,
        logs,
        selectedCustomerIds,
        totalDebtorsCount,
        totalCreditorsCount,
        totalSettledCount,
        totalDebitAmount,
        totalCreditAmount,
        netTotalDebt,
        sentDebtorsCount,
        pendingDebtorsCount,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        importCustomers,
        addTransaction,
        updateCustomerStatus,
        recordSendLog,
        toggleSelectCustomer,
        selectAllDebtors,
        selectAllFiltered,
        deselectAll,
        saveTemplate,
        deleteTemplate,
        setDefaultTemplate,
        updateSettings,
        resetToSampleData,
        clearAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
