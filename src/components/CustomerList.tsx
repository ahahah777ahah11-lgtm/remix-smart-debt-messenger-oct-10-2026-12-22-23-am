import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Send,
  MessageCircle,
  PlusCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Copy,
  Check,
  Phone,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
  Printer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, CustomerStatus } from '../types';
import { createSmsUri, createWhatsAppUri, renderTemplate } from '../utils/smsHelper';
import { exportCustomersToExcel } from '../utils/spreadsheetParser';

interface CustomerListProps {
  onOpenAddTransaction: (customer: Customer) => void;
  onOpenCustomerDetails: (customer: Customer) => void;
  onOpenEditCustomer: (customer: Customer) => void;
  onOpenBulkSend: () => void;
  onOpenExportReport: (scope: 'debtors' | 'all' | 'selected') => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onOpenAddTransaction,
  onOpenCustomerDetails,
  onOpenEditCustomer,
  onOpenBulkSend,
  onOpenExportReport
}) => {
  const {
    customers,
    settings,
    templates,
    deleteCustomer,
    updateCustomerStatus,
    recordSendLog,
    selectedCustomerIds,
    toggleSelectCustomer,
    selectAllFiltered,
    deselectAll,
    selectAllDebtors
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'debtors' | 'creditors' | 'settled' | 'unnotified' | 'sent'>('debtors');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'name' | 'last_sent'>('balance_desc');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Active default template
  const defaultTemplate = templates.find((t) => t.isDefault) || templates[0];

  // Filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.phone.includes(searchQuery) ||
        (cust.notes && cust.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cust.accountNumber && cust.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status/Balance tab
      switch (activeTab) {
        case 'debtors':
          return cust.balance > 0;
        case 'creditors':
          return cust.balance < 0;
        case 'settled':
          return cust.balance === 0;
        case 'unnotified':
          return cust.balance > 0 && cust.status === 'unnotified';
        case 'sent':
          return cust.status === 'sent';
        case 'all':
        default:
          return true;
      }
    });
  }, [customers, searchQuery, activeTab]);

  // Sorting
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      if (sortBy === 'balance_desc') return b.balance - a.balance;
      if (sortBy === 'balance_asc') return a.balance - b.balance;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
      if (sortBy === 'last_sent') {
        const dateA = a.lastSentAt ? new Date(a.lastSentAt).getTime() : 0;
        const dateB = b.lastSentAt ? new Date(b.lastSentAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [filteredCustomers, sortBy]);

  // Counts for tabs
  const debtorCount = customers.filter((c) => c.balance > 0).length;
  const creditorCount = customers.filter((c) => c.balance < 0).length;
  const settledCount = customers.filter((c) => c.balance === 0).length;
  const unnotifiedDebtorCount = customers.filter((c) => c.balance > 0 && c.status === 'unnotified').length;
  const sentCount = customers.filter((c) => c.status === 'sent').length;

  // Single SMS Send Action
  const handleSendSingleSms = (customer: Customer) => {
    if (!defaultTemplate) return;
    const message = renderTemplate(defaultTemplate.content, customer, settings);
    const uri = createSmsUri(customer.phone, message, settings.countryCode);

    // Record log and update status
    updateCustomerStatus(customer.id, 'sent', 'sms');
    recordSendLog({
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      amount: customer.balance,
      messageText: message,
      channel: 'sms',
      status: 'sent'
    });

    // Open device SMS app
    window.location.href = uri;
  };

  // Single WhatsApp Send Action
  const handleSendSingleWhatsApp = (customer: Customer) => {
    if (!defaultTemplate) return;
    const message = renderTemplate(defaultTemplate.content, customer, settings);
    const uri = createWhatsAppUri(customer.phone, message, settings.countryCode);

    updateCustomerStatus(customer.id, 'sent', 'whatsapp');
    recordSendLog({
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      amount: customer.balance,
      messageText: message,
      channel: 'whatsapp',
      status: 'sent'
    });

    // Open WhatsApp
    window.open(uri, '_blank');
  };

  // Copy phone number
  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Check if all currently visible are selected
  const allVisibleSelected =
    sortedCustomers.length > 0 &&
    sortedCustomers.every((c) => selectedCustomerIds.includes(c.id));

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      deselectAll();
    } else {
      selectAllFiltered(sortedCustomers.map((c) => c.id));
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Top Header & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-4">
        
        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، رقم الهاتف، رقم الحساب أو الملاحظات..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                مسح
              </button>
            )}
          </div>

          {/* Sort & Excel Export */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="balance_desc">الأعلى ديناً أولاً</option>
                <option value="balance_asc">الأقل ديناً</option>
                <option value="name">الاسم أبجدياً (أ-ي)</option>
                <option value="last_sent">الأحدث إشعاراً</option>
              </select>
            </div>

            {/* Print & PDF Report Button */}
            <button
              onClick={() => onOpenExportReport(activeTab === 'debtors' ? 'debtors' : 'all')}
              title="معاينة وطباعة كشف الديون وتصدير PDF للأرشفة الورقية"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">طباعة / PDF</span>
            </button>

            {/* Direct Excel Export */}
            <button
              onClick={() => exportCustomersToExcel(sortedCustomers, undefined, settings.storeName, settings.currency)}
              title="تصدير كشف الحسابات المعروضة إلى ملف Excel"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>
          </div>

        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('debtors')}
            className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'debtors'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>🔴 المدينون فقط</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono-num ${
              activeTab === 'debtors' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              {debtorCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unnotified')}
            className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'unnotified'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>لم يُرسل لهم بعد</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono-num ${
              activeTab === 'unnotified' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              {unnotifiedDebtorCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sent'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم الإرسال</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono-num ${
              activeTab === 'sent' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {sentCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>جميع العملاء</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono-num">
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('creditors')}
            className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'creditors'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>الدائنون (لهم مبالغ)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-mono-num">
              {creditorCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settled')}
            className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settled'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>مسددون (0)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono-num">
              {settledCount}
            </span>
          </button>
        </div>

      </div>

      {/* Batch Action Bar (if items selected) */}
      {selectedCustomerIds.length > 0 && (
        <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold font-mono-num">
              {selectedCustomerIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-900">
              تم تحديد {selectedCustomerIds.length} عميل
            </span>
            <button
              onClick={deselectAll}
              className="text-xs text-amber-700 hover:underline mr-2"
            >
              إلغاء التحديد
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenExportReport('selected')}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-800 border border-amber-300 hover:bg-amber-100/60 shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>طباعة كشف المحددين (PDF / أرشفة)</span>
            </button>

            <button
              onClick={onOpenBulkSend}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>إرسال رسائل SMS / واتساب للمحددين ({selectedCustomerIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm">
          <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3.5 sm:p-4 w-10 text-center">
                <button
                  onClick={handleToggleSelectAllVisible}
                  title="تحديد الكل في هذه الصفحة"
                  className="text-slate-400 hover:text-slate-600"
                >
                  {allVisibleSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3.5 sm:p-4">اسم العميل ورقم الحساب</th>
              <th className="p-3.5 sm:p-4">رقم الهاتف</th>
              <th className="p-3.5 sm:p-4 text-rose-600">المبلغ عليه (مدين)</th>
              <th className="p-3.5 sm:p-4 text-emerald-600">المبلغ له (دائن)</th>
              <th className="p-3.5 sm:p-4">صافي الرصيد المستحق</th>
              <th className="p-3.5 sm:p-4">حالة الإشعار</th>
              <th className="p-3.5 sm:p-4 text-center">إجراءات المديونية والرسائل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">لا توجد سجلات تطابق الفلتر الحالي</p>
                    <p className="text-xs text-slate-400">
                      جرب تغيير الفلتر أو إضافة واستيراد عملاء جدد.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedCustomers.map((customer) => {
                const isSelected = selectedCustomerIds.includes(customer.id);
                const isDebtor = customer.balance > 0;
                const isCreditor = customer.balance < 0;

                return (
                  <tr
                    key={customer.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 sm:p-4 text-center">
                      <button
                        onClick={() => toggleSelectCustomer(customer.id)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Name & Code */}
                    <td className="p-3.5 sm:p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenCustomerDetails(customer)}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-right hover:underline"
                        >
                          {customer.name}
                        </button>
                        {customer.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {customer.category}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono-num flex items-center gap-2">
                        <span>{customer.accountNumber || 'حساب بدون رقم'}</span>
                        {customer.notes && (
                          <span className="truncate max-w-xs text-slate-500" title={customer.notes}>
                            • {customer.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="p-3.5 sm:p-4">
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-num font-semibold text-slate-700 text-xs" dir="ltr">
                            {customer.phone}
                          </span>
                          <button
                            onClick={() => handleCopyPhone(customer.id, customer.phone)}
                            title="نسخ رقم الهاتف"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                          >
                            {copiedPhoneId === customer.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`tel:${customer.phone}`}
                            title="اتصال هاتفي"
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">بدون رقم</span>
                      )}
                    </td>

                    {/* Debit (عليه) */}
                    <td className="p-3.5 sm:p-4 text-rose-600 font-bold font-mono-num">
                      {customer.debit.toLocaleString('ar-EG')}
                    </td>

                    {/* Credit (له) */}
                    <td className="p-3.5 sm:p-4 text-emerald-600 font-bold font-mono-num">
                      {customer.credit.toLocaleString('ar-EG')}
                    </td>

                    {/* Net Balance */}
                    <td className="p-3.5 sm:p-4">
                      {isDebtor ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-black font-mono-num border border-rose-200">
                          <span>{customer.balance.toLocaleString('ar-EG')}</span>
                          <span className="text-[10px] font-normal">{settings.currency}</span>
                        </span>
                      ) : isCreditor ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 font-black font-mono-num border border-teal-200">
                          <span>له {Math.abs(customer.balance).toLocaleString('ar-EG')}</span>
                          <span className="text-[10px] font-normal">{settings.currency}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs">
                          مسدد بالكامل
                        </span>
                      )}
                    </td>

                    {/* Notification Status */}
                    <td className="p-3.5 sm:p-4">
                      {customer.status === 'sent' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>تم الإرسال</span>
                            {customer.lastSentChannel && (
                              <span className="text-[9px] uppercase">({customer.lastSentChannel})</span>
                            )}
                          </span>
                          {customer.lastSentAt && (
                            <div className="text-[10px] text-slate-400">
                              {new Date(customer.lastSentAt).toLocaleDateString('ar-EG', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      ) : customer.status === 'postponed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>مؤجل</span>
                        </span>
                      ) : customer.status === 'exempt' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                          مستثنى
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>لم يُرسل بعد</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* SMS Direct Button */}
                        <button
                          onClick={() => handleSendSingleSms(customer)}
                          disabled={!customer.phone}
                          title={customer.phone ? 'إرسال رسالة SMS مخصصة' : 'العميل لا يملك رقم هاتف'}
                          className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            customer.phone
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'opacity-40 cursor-not-allowed text-slate-400'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">SMS</span>
                        </button>

                        {/* WhatsApp Direct Button */}
                        <button
                          onClick={() => handleSendSingleWhatsApp(customer)}
                          disabled={!customer.phone}
                          title={customer.phone ? 'إرسال عبر واتساب' : 'العميل لا يملك رقم هاتف'}
                          className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            customer.phone
                              ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                              : 'opacity-40 cursor-not-allowed text-slate-400'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="hidden xl:inline">واتساب</span>
                        </button>

                        {/* Add Transaction Button */}
                        <button
                          onClick={() => onOpenAddTransaction(customer)}
                          title="إضافة مديونية جديدة أو سداد"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-all"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>

                        {/* Account Statement */}
                        <button
                          onClick={() => onOpenCustomerDetails(customer)}
                          title="كشف حساب العميل وسجل الحركات"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onOpenEditCustomer(customer)}
                          title="تعديل بيانات العميل"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
                              deleteCustomer(customer.id);
                            }
                          }}
                          title="حذف العميل"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div>
          عرض <strong>{sortedCustomers.length}</strong> من إجمالي <strong>{customers.length}</strong> عميل
        </div>
        <div className="flex items-center gap-3">
          <span>المدينون: <strong className="text-rose-600">{debtorCount}</strong></span>
          <span>•</span>
          <span>الدائنون: <strong className="text-emerald-600">{creditorCount}</strong></span>
          <span>•</span>
          <span>المسددون: <strong className="text-slate-600">{settledCount}</strong></span>
        </div>
      </div>

    </div>
  );
};
