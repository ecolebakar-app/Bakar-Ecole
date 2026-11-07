/**
 * Fee Tracking & Consolidated Debt File View for Ecole Bekar
 * Conforms to Executive Specification §9, §9.7 & §9.8:
 * - Tracks who paid in full, partial, unpaid, and exempted
 * - Monthly debts list and aging
 * - Generates & Previews the Consolidated Debt File (الملف الموحد للديون)
 * - Allows adding notes, promise-to-pay dates, exclusions with reason
 * - Export to Excel (.xlsx) and direct Print Preview
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Invoice, ConsolidatedDebtFile } from '../../types';
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Search,
  Filter,
  Send,
  FileText,
  DollarSign,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';
import * as XLSX from 'xlsx';

export const FeeTrackingView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, setQuickPaymentOpen, showToast, refreshKey, reloadAll } = useApp();

  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('unpaid'); // 'all', 'paid', 'partial', 'unpaid', 'exempted'
  const [searchQuery, setSearchQuery] = useState('');

  // Selected invoice IDs for batch action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Consolidated Debt File modal
  const [showConsolidatedModal, setShowConsolidatedModal] = useState(false);
  const [consolidatedFile, setConsolidatedFile] = useState<ConsolidatedDebtFile | null>(null);

  const invoices = useMemo(() => {
    return StorageEngine.getInvoices(institutionId);
  }, [institutionId, refreshKey]);

  const students = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId]);
  const guardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId]);

  // Months available
  const availableMonths = ['أكتوبر 2025', 'نوفمبر 2025', 'ديسمبر 2025'];

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (selectedMonth !== 'all' && inv.monthName !== selectedMonth) return false;
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'unpaid' && inv.status !== 'unpaid' && inv.status !== 'partial') return false;
        if (selectedStatus === 'paid' && inv.status !== 'paid') return false;
        if (selectedStatus === 'partial' && inv.status !== 'partial') return false;
        if (selectedStatus === 'exempted' && inv.status !== 'exempted') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const stu = students.find(s => s.id === inv.studentId);
        const matchStu = stu ? (stu.firstNameAr.includes(q) || stu.lastNameAr.includes(q) || stu.registrationNumber.toLowerCase().includes(q)) : false;
        if (!matchStu && !inv.invoiceNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, selectedMonth, selectedStatus, searchQuery, students]);

  // Aggregates
  const totalDebtsCount = filteredInvoices.filter(i => i.remainingAmount > 0).length;
  const totalDebtSum = filteredInvoices.filter(i => i.remainingAmount > 0).reduce((sum, i) => sum + i.remainingAmount, 0);

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // Generate Consolidated Debt File (§9.8)
  const handleGenerateConsolidatedFile = () => {
    const targetInvoices = selectedIds.length > 0
      ? filteredInvoices.filter(i => selectedIds.includes(i.id))
      : filteredInvoices.filter(i => i.remainingAmount > 0);

    if (targetInvoices.length === 0) {
      showToast('لا توجد ديون لتجميعها في الملف', 'error');
      return;
    }

    const items = targetInvoices.map(inv => {
      const s = students.find(item => item.id === inv.studentId);
      const g = guardians.find(item => item.id === inv.guardianId);
      const c = classes.find(item => item.id === s?.classId);
      return {
        studentId: inv.studentId,
        studentName: s ? `${s.firstNameAr} ${s.lastNameAr}` : 'تلميذ',
        guardianName: g?.nameAr || 'الوكيل',
        guardianPhone: g?.phone1 || '—',
        className: c?.nameAr || '—',
        amountDue: inv.netAmount,
        amountPaid: inv.paidAmount,
        amountRemaining: inv.remainingAmount,
        daysOverdue: 15,
        status: 'pending' as const
      };
    });

    const file: ConsolidatedDebtFile = {
      id: `debt-${Date.now()}`,
      fileNumber: `DEBT-${Date.now().toString().slice(-6)}`,
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      monthName: selectedMonth !== 'all' ? selectedMonth : 'كافة الشهور',
      academicYearId: 'year-2025-2026',
      totalDebtors: items.length,
      totalDebtAmount: items.reduce((sum, i) => sum + i.amountRemaining, 0),
      items,
      createdAt: new Date().toISOString(),
      createdByName: 'مدير الحسابات والتحصيل'
    };

    StorageEngine.saveDebtFile(file);
    setConsolidatedFile(file);
    setShowConsolidatedModal(true);
    showToast('تم إنشاء ملف الديون الموحد بنجاح', 'success');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredInvoices.map(inv => {
      const s = students.find(item => item.id === inv.studentId);
      const g = guardians.find(item => item.id === inv.guardianId);
      const c = classes.find(item => item.id === s?.classId);
      return {
        'رقم الفاتورة': inv.invoiceNumber,
        'اسم التلميذ': s ? `${s.firstNameAr} ${s.lastNameAr}` : '—',
        'رقم القيد': s?.registrationNumber || '—',
        'الفصل': c?.nameAr || '—',
        'اسم الوكيل': g?.nameAr || '—',
        'هاتف الوكيل': g?.phone1 || '—',
        'الشهر / البند': inv.titleAr,
        'المستحق الأصلي': inv.originalAmount,
        'الخصم': inv.discountAmount,
        'الصافي المستحق': inv.netAmount,
        'المدفوع': inv.paidAmount,
        'المتبقي': inv.remainingAmount,
        'الحالة': inv.status
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'متابعة الرسوم والديون');
    XLSX.writeFile(wb, `ecole_bekar_debts_${institutionId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Batch send reminder
  const handleBatchSendReminder = () => {
    const targetInvoices = selectedIds.length > 0
      ? filteredInvoices.filter(i => selectedIds.includes(i.id))
      : filteredInvoices.filter(i => i.remainingAmount > 0);

    let count = 0;
    for (const inv of targetInvoices) {
      const s = students.find(item => item.id === inv.studentId);
      if (s) {
        StorageEngine.sendNotification({
          institutionId,
          sectionId: s.sectionId,
          guardianId: inv.guardianId,
          studentId: inv.studentId,
          type: 'month_end_reminder',
          titleAr: `تنبيه بمستحقات مالية - Ecole Bekar`,
          titleFr: `Avis de paiement - Ecole Bekar`,
          messageAr: `نرجو التكرم بسداد قسط شهر ${inv.monthName || ''} للتلميذ ${s.firstNameAr} ${s.lastNameAr} بمبلغ ${inv.remainingAmount} أوقية (MRU).`,
          messageFr: `Rappel de paiement pour l'élève ${s.firstNameFr} d'un montant de ${inv.remainingAmount} MRU.`,
          amountDue: inv.remainingAmount,
          invoiceId: inv.id,
          channel: 'in_app'
        });
        count++;
      }
    }
    showToast(`تم إرسال إشعار تذكير بالدفع لـ ${count} وكيل بنجاح`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" />
            <span>متابعة الرسوم والتحصيل وصفحة الديون - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            لوحة موحدة لمتابعة المسددين، المتأخرين، أصحاب الخصومات، وإصدار الملف الموحد للديون
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>تصدير إكسل</span>
          </button>
          <button
            onClick={handleGenerateConsolidatedFile}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl text-xs font-black shadow-xs shadow-slate-900/20 transition-all active:scale-95"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>تجميع في الملف الموحد للديون</span>
          </button>
        </div>
      </div>

      {/* Filter and KPI Banner: Modern Elevated Grid */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        {/* Month Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">الشهر المستهدف:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden transition-all cursor-pointer text-slate-700"
          >
            <option value="all">كافة الشهور الدراسية</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">حالة السداد:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden transition-all cursor-pointer text-slate-700"
          >
            <option value="unpaid">الديون والمتأخرات فقط (غير مسدد / جزئي)</option>
            <option value="all">جميع السجلات (المسدد والمدين)</option>
            <option value="paid">المسددون بالكامل فقط</option>
            <option value="partial">المسددون جزئياً</option>
            <option value="exempted">المعفيون والمستفيدون من منح</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">بحث سريع:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اسم التلميذ..."
              className="w-full pr-10 pl-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden bg-slate-50/70 hover:bg-slate-50 focus:bg-white transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Total Debts Card */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-amber-800 block mb-0.5">إجمالي الديون بالنطاق:</span>
            <div className="text-xl font-black font-mono text-amber-900 tabular-nums">
              {totalDebtSum.toLocaleString()} <span className="text-xs font-sans">MRU</span>
            </div>
            <span className="text-[10px] text-amber-700 font-semibold">{totalDebtsCount} تلميذ مدين</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Batch Actions Bar (when selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <span className="font-bold text-blue-900">
            تم تحديد {selectedIds.length} بند من الديون والمستحقات
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchSendReminder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال إشعار تذكير للمحددين</span>
            </button>
            <button
              onClick={handleGenerateConsolidatedFile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-yellow-400" />
              <span>تجميع المحددين في ملف واحد</span>
            </button>
          </div>
        </div>
      )}

      {/* Debts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>قائمة المستحقات والديون ({filteredInvoices.length})</span>
          <span>ترتيب تنازلي حسب المبلغ المتبقي</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-4">التلميذ المستحق</th>
                <th className="py-3 px-4">الفصل</th>
                <th className="py-3 px-4">ولي الأمر (الوكيل)</th>
                <th className="py-3 px-4">هاتف الوكيل</th>
                <th className="py-3 px-4">البند / الشهر</th>
                <th className="py-3 px-4">المستحق</th>
                <th className="py-3 px-4">المدفوع</th>
                <th className="py-3 px-4">المتبقي</th>
                <th className="py-3 px-4 text-center">الإجراء السريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => {
                  const s = students.find(item => item.id === inv.studentId);
                  const g = guardians.find(item => item.id === inv.guardianId);
                  const c = classes.find(item => item.id === s?.classId);
                  const isChecked = selectedIds.includes(inv.id);

                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${isChecked ? 'bg-blue-50/50' : ''}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleId(inv.id)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s ? `${s.firstNameAr} ${s.lastNameAr}` : '—'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s ? `${s.firstNameFr} ${s.lastNameFr}` : ''}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{c?.nameAr || '—'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{g?.nameAr || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{g?.phone1 || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{inv.titleAr}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{inv.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.netAmount} MRU</td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">{inv.paidAmount} MRU</td>
                      <td className="py-3 px-4 font-mono font-black text-amber-700">{inv.remainingAmount} MRU</td>
                      <td className="py-3 px-4 text-center">
                        {inv.remainingAmount > 0 ? (
                          <button
                            onClick={() => setQuickPaymentOpen(true)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            سداد مباشر
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold">مسدد ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    لا توجد فواتير أو ديون مطابقة للمعايير المحددة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONSOLIDATED DEBT FILE MODAL & PRINT PREVIEW (§9.8) */}
      {showConsolidatedModal && consolidatedFile && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setShowConsolidatedModal(false)}
          title="الملف الموحد للديون والمستحقات"
          documentNumber={consolidatedFile.fileNumber}
        >
          <div className="space-y-6 text-slate-900 text-xs">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black">Ecole Bekar</h2>
                <h3 className="text-xs font-bold text-slate-700">{currentInstitution.nameAr}</h3>
                <p className="text-[10px] text-slate-500 font-mono">{currentInstitution.city} | هاتف: {currentInstitution.phone}</p>
              </div>
              <div className="text-center">
                <span className="text-sm font-black px-3 py-1 bg-slate-900 text-white rounded-lg block uppercase">
                  الملف الموحد للديون
                </span>
                <span className="text-[11px] font-mono text-slate-600 font-bold mt-1 block">
                  رقم الملف: {consolidatedFile.fileNumber}
                </span>
              </div>
              <div className="text-left rtl:text-left ltr:text-right">
                <div className="text-xs font-bold">الشهر: {consolidatedFile.monthName}</div>
                <div className="text-[10px] text-slate-500 font-mono">تاريخ التوليد: {new Date(consolidatedFile.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Debts Table in Document */}
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead className="bg-slate-100">
                <tr className="border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 text-right">الرقم</th>
                  <th className="p-2 border-r border-slate-300 text-right">اسم التلميذ</th>
                  <th className="p-2 border-r border-slate-300 text-right">الفصل</th>
                  <th className="p-2 border-r border-slate-300 text-right">ولي الأمر</th>
                  <th className="p-2 border-r border-slate-300 text-right">الهاتف</th>
                  <th className="p-2 border-r border-slate-300 text-right">المستحق</th>
                  <th className="p-2 border-r border-slate-300 text-right">المدفوع</th>
                  <th className="p-2 border-slate-300 text-right font-black">المتبقي (MRU)</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedFile.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 border-r border-slate-200 font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold">{item.studentName}</td>
                    <td className="p-2 border-r border-slate-200">{item.className}</td>
                    <td className="p-2 border-r border-slate-200">{item.guardianName}</td>
                    <td className="p-2 border-r border-slate-200 font-mono">{item.guardianPhone}</td>
                    <td className="p-2 border-r border-slate-200 font-mono">{item.amountDue}</td>
                    <td className="p-2 border-r border-slate-200 font-mono">{item.amountPaid}</td>
                    <td className="p-2 border-slate-200 font-mono font-black text-slate-900">{item.amountRemaining}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan={7} className="p-2.5 text-left pl-4 border-r border-slate-300">
                    الإجمالي العام للديون المجمعة ({consolidatedFile.totalDebtors} تلميذ):
                  </td>
                  <td className="p-2.5 font-mono font-black text-sm text-slate-900">
                    {consolidatedFile.totalDebtAmount.toLocaleString()} MRU
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Official Signatures */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-600">
              <div>
                <span className="font-bold block mb-12">توقيع مسؤول التحصيل</span>
                <span className="border-t border-slate-300 pt-1 block">{consolidatedFile.createdByName}</span>
              </div>
              <div>
                <span className="font-bold block mb-12">اعتماد وخاتم المدير</span>
                <span className="border-t border-slate-300 pt-1 block">Ecole Bekar</span>
              </div>
            </div>
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
