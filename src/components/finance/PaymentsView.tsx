/**
 * Payments & Collections View for Ecole Bekar
 * Conforms to Executive Specification §8:
 * - Records actual cash/electronic receipts
 * - Unique sequential receipt numbers
 * - Direct printable receipts
 * - Cancel / Void receipt with mandatory reason and audit log (never silent deletion)
 * - Filtering and Excel export
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { PaymentReceipt } from '../../types';
import {
  Receipt,
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';
import { PrintableReceipt } from './PrintableReceipt';
import * as XLSX from 'xlsx';

export const PaymentsView: React.FC = () => {
  const { institutionId, currentInstitution, setQuickPaymentOpen, showToast, refreshKey, reloadAll } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Modal for voiding/cancelling a receipt
  const [voidingReceipt, setVoidingReceipt] = useState<PaymentReceipt | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Selected receipt for printing
  const [selectedPrintReceipt, setSelectedPrintReceipt] = useState<PaymentReceipt | null>(null);

  const payments = useMemo(() => {
    return StorageEngine.getPayments(institutionId);
  }, [institutionId, refreshKey]);

  const students = useMemo(() => StorageEngine.getStudents(institutionId), [institutionId]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = p.receiptNumber.toLowerCase().includes(q);
        const stu = students.find(s => s.id === p.studentId);
        const matchStu = stu ? (stu.firstNameAr.includes(q) || stu.lastNameAr.includes(q) || stu.registrationNumber.toLowerCase().includes(q)) : false;
        if (!matchNum && !matchStu) return false;
      }
      return true;
    });
  }, [payments, methodFilter, searchQuery, students]);

  const totalCollectedSum = filteredPayments
    .filter(p => !p.isCancelled)
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingReceipt) return;
    if (!voidReason.trim()) {
      showToast('يرجى كتابة سبب الإلغاء بدقة للتدقيق المالي', 'error');
      return;
    }

    const res = StorageEngine.voidReceipt(voidingReceipt.id, voidReason, 'أمين الصندوق');
    if (res.success) {
      showToast(`تم إلغاء الوصل ${voidingReceipt.receiptNumber} وإعادة قيد المبالغ كديون غير مسددة`, 'info');
      setVoidingReceipt(null);
      setVoidReason('');
      reloadAll();
    } else {
      showToast(res.message || 'فشل إلغاء الوصل', 'error');
    }
  };

  const handleExportExcel = () => {
    const data = filteredPayments.map(p => {
      const s = students.find(item => item.id === p.studentId);
      return {
        'رقم الوصل': p.receiptNumber,
        'التلميذ': s ? `${s.firstNameAr} ${s.lastNameAr}` : '—',
        'رقم القيد': s?.registrationNumber || '—',
        'المبلغ المدفوع': p.amountPaid,
        'العملة': 'MRU',
        'طريقة الدفع': p.paymentMethod,
        'المرجع البنكي': p.bankReference || '—',
        'التاريخ': p.paymentDate,
        'أمين الصندوق': p.cashierName,
        'الحالة': p.isCancelled ? 'ملغى' : 'ساري',
        'سبب الإلغاء إن وجد': p.cancelReason || '—'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المقبوضات');
    XLSX.writeFile(wb, `ecole_bekar_payments_${institutionId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>سجل المقبوضات النقدية والوصولات - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل وإدارة المقبوضات الفعلية، إصدار إيصالات رسمية، وإلغاء موثق بدفتر التدقيق
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
            onClick={() => setQuickPaymentOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs shadow-emerald-900/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>قبض دفعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter and Summary Bar: Modern Elevated Grid */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الوصل أو اسم التلميذ..."
            className="w-full pr-10 pl-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-hidden bg-slate-50/70 hover:bg-slate-50 focus:bg-white transition-all text-slate-800"
          />
        </div>

        <div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-hidden bg-slate-50/70 hover:bg-slate-50 focus:bg-white transition-all cursor-pointer text-slate-700"
          >
            <option value="all">كافة طرق الدفع</option>
            <option value="cash">نقدًا (الصندوق)</option>
            <option value="mobile_payment">دفع إلكتروني (بنكيلي/مصرفي/سداد)</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="cheque">شيك مصرفي</option>
          </select>
        </div>

        <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
          <span className="font-bold text-emerald-800">إجمالي المقبوضات الفعلية:</span>
          <span className="font-mono font-black text-emerald-700 text-sm tabular-nums">
            {totalCollectedSum.toLocaleString()} MRU
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>سجل الوصولات المعتمدة ({filteredPayments.length})</span>
          <span>المبالغ محتسبة ومحدثة لحظياً</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">رقم الوصل</th>
                <th className="py-3 px-4">التلميذ المستفيد</th>
                <th className="py-3 px-4">المبلغ المقبوض</th>
                <th className="py-3 px-4">طريقة الدفع</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">المستلم (أمين الصندوق)</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(p => {
                  const s = students.find(item => item.id === p.studentId);
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${p.isCancelled ? 'bg-rose-50/40 text-slate-400' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s ? `${s.firstNameAr} ${s.lastNameAr}` : '—'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        {p.amountPaid.toLocaleString()} MRU
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.paymentMethod === 'cash' ? 'نقدًا' :
                           p.paymentMethod === 'mobile_payment' ? 'بنكيلي/مصرفي' :
                           p.paymentMethod === 'bank_transfer' ? 'تحويل' : 'شيك'}
                        </span>
                        {p.bankReference && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{p.bankReference}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.paymentDate}</td>
                      <td className="py-3 px-4 text-slate-700">{p.cashierName}</td>
                      <td className="py-3 px-4">
                        {p.isCancelled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={p.cancelReason}>
                            ملغى (Void)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            معتمد ✓
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Receipt */}
                          <button
                            onClick={() => setSelectedPrintReceipt(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="معاينة وطباعة الوصل"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Cancel / Void Receipt */}
                          {!p.isCancelled && (
                            <button
                              onClick={() => setVoidingReceipt(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="إلغاء الوصل مع بيان السبب"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    لا توجد وصولات قبض مطابقة للمعايير المحددة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Void / Cancel Receipt with Mandatory Reason */}
      {voidingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">إلغاء وصل القبض رقم {voidingReceipt.receiptNumber}</h4>
                <p className="text-[11px] text-slate-500">المبلغ: {voidingReceipt.amountPaid} أوقية (MRU)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              إلغاء الوصل سيقوم بإعادة فتح الفواتير المرتبطة كديون غير مسددة، وخصم المبلغ من الصندوق النقدي، مع تسجيل عملية الإلغاء وهوية من قام بها في سجل التدقيق المالي.
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  سبب الإلغاء (إلزامي للتدقيق والمساءلة) *:
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="مثال: خطأ في إدخال المبلغ / شيك مرتجع / تسجيل متكرر..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoidingReceipt(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  تأكيد إلغاء الوصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {selectedPrintReceipt && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setSelectedPrintReceipt(null)}
          title="وصل قبض رسمي"
          documentNumber={selectedPrintReceipt.receiptNumber}
        >
          <PrintableReceipt receipt={selectedPrintReceipt} />
        </PrintPreviewModal>
      )}
    </div>
  );
};
