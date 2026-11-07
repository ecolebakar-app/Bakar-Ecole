/**
 * Quick Cashier Payment Collection Modal for Ecole Bekar
 * Instant payment recording from any screen with atomic receipt creation.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Student, Invoice } from '../../types';
import { PlusCircle, X, Search, CheckCircle2, Printer, CreditCard, DollarSign } from 'lucide-react';
import { PrintableReceipt } from './PrintableReceipt';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';

export const QuickPaymentModal: React.FC = () => {
  const { quickPaymentOpen, setQuickPaymentOpen, institutionId, currentInstitution, reloadAll, showToast } = useApp();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'mobile_payment'>('cash');
  const [bankReference, setBankReference] = useState('');
  const [notes, setNotes] = useState('');
  const [cashierName, setCashierName] = useState('أمين الصندوق');

  // Completed receipt for instant printing
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);
  const [showReceiptPrint, setShowReceiptPrint] = useState(false);

  const students = useMemo(() => StorageEngine.getStudents(institutionId), [institutionId, quickPaymentOpen]);

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return [];
    const q = studentSearch.toLowerCase().trim();
    return students.filter(s =>
      s.firstNameAr.includes(q) ||
      s.lastNameAr.includes(q) ||
      s.registrationNumber.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [students, studentSearch]);

  // Dues for the selected student
  const studentInvoices = useMemo(() => {
    if (!selectedStudent) return [];
    return StorageEngine.getInvoices(institutionId, selectedStudent.id)
      .filter(inv => inv.remainingAmount > 0 && inv.status !== 'void');
  }, [selectedStudent, institutionId]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch('');
    const dues = StorageEngine.getInvoices(institutionId, student.id)
      .filter(inv => inv.remainingAmount > 0 && inv.status !== 'void');
    if (dues.length > 0) {
      setSelectedInvoiceIds([dues[0].id]);
      setAmountPaid(dues[0].remainingAmount);
    } else {
      setSelectedInvoiceIds([]);
      setAmountPaid(0);
    }
  };

  const handleToggleInvoice = (invId: string) => {
    let nextIds: string[];
    if (selectedInvoiceIds.includes(invId)) {
      nextIds = selectedInvoiceIds.filter(id => id !== invId);
    } else {
      nextIds = [...selectedInvoiceIds, invId];
    }
    setSelectedInvoiceIds(nextIds);

    // Auto-sum amount
    const sum = studentInvoices
      .filter(i => nextIds.includes(i.id))
      .reduce((acc, curr) => acc + curr.remainingAmount, 0);
    setAmountPaid(sum);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      showToast('يرجى اختيار التلميذ أولاً', 'error');
      return;
    }
    if (amountPaid <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر', 'error');
      return;
    }

    const res = StorageEngine.collectPayment({
      institutionId,
      sectionId: selectedStudent.sectionId,
      academicYearId: selectedStudent.academicYearId,
      studentId: selectedStudent.id,
      guardianId: selectedStudent.guardianId,
      amountPaid,
      paymentMethod,
      bankReference: bankReference || undefined,
      invoiceIds: selectedInvoiceIds,
      cashierName,
      cashierId: 'cashier-current',
      notes: notes || undefined
    });

    if (res.success && res.receipt) {
      showToast(`تم تسجيل الدفعة بنجاح برقم وصل: ${res.receipt.receiptNumber}`, 'success');
      setCompletedReceipt(res.receipt);
      setShowReceiptPrint(true);
      reloadAll();
      // Reset form
      setSelectedStudent(null);
      setSelectedInvoiceIds([]);
      setAmountPaid(0);
      setNotes('');
      setBankReference('');
    } else {
      showToast(res.message || 'حدث خطأ أثناء تسجيل الدفعة', 'error');
    }
  };

  if (!quickPaymentOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold">تسجيل مقبوض نقدي / دفعة سريعة</h3>
                <p className="text-[11px] text-slate-300">{currentInstitution.nameAr}</p>
              </div>
            </div>
            <button
              onClick={() => setQuickPaymentOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Step 1: Select Student */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البحث عن التلميذ (بالاسم):
              </label>
              {!selectedStudent ? (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="اكتب اسم التلميذ..."
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  {filteredStudents.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      {filteredStudents.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStudent(s)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center border-b border-slate-100 last:border-none"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{s.firstNameAr} {s.lastNameAr}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {s.gender === 'male' ? 'ذكر' : 'أنثى'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-blue-900">
                      {selectedStudent.firstNameAr} {selectedStudent.lastNameAr}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setSelectedInvoiceIds([]);
                      setAmountPaid(0);
                    }}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    تغيير
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Dues & Invoices */}
            {selectedStudent && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المستحقات غير المسددة للتلميذ:
                </label>
                {studentInvoices.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {studentInvoices.map(inv => {
                      const isChecked = selectedInvoiceIds.includes(inv.id);
                      return (
                        <div
                          key={inv.id}
                          onClick={() => handleToggleInvoice(inv.id)}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isChecked ? 'bg-blue-100/70 border border-blue-300' : 'bg-white border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div
                              className="rounded text-blue-600 focus:ring-0"
                            />
                            <div>
                              <span className="font-semibold text-slate-800">{inv.titleAr}</span>
                              <span className="text-[10px] text-slate-500 block">رقم: {inv.invoiceNumber}</span>
                            </div>
                          </div>
                          <div className="text-left font-mono font-bold text-slate-900">
                            {inv.remainingAmount} أوقية
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
                    لا توجد مستحقات متأخرة على هذا التلميذ حالياً. يمكنك تسجيل دفعة رصيد مسبق.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Amount & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المقبوض (أوقية MRU) *:
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="number"
                    min="1"
                    required
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full pr-9 pl-3 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  طريقة الدفع *:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="cash">نقدًا (صندوق المؤسسة)</option>
                  <option value="mobile_payment">دفع إلكتروني (بنكيلي / مصرفي / سداد)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cheque">شيك مصرفي</option>
                </select>
              </div>
            </div>

            {/* Reference for transfer / mobile payment */}
            {paymentMethod !== 'cash' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مرجع العملية أو رقم الشيك/التحويل:
                </label>
                <input
                  type="text"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  placeholder="مثال: Bankily Ref #8934298 أو رقم الشيك..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Cashier Name & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المستلم (أمين الصندوق):
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات اختيارية..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickPaymentOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95"
              >
                حفظ وإصدار الوصل
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Instant Print Preview Modal for the generated receipt */}
      {completedReceipt && (
        <PrintPreviewModal
          isOpen={showReceiptPrint}
          onClose={() => {
            setShowReceiptPrint(false);
            setQuickPaymentOpen(false);
          }}
          title="وصل قبض رسمي"
          documentNumber={completedReceipt.receiptNumber}
        >
          <PrintableReceipt receipt={completedReceipt} />
        </PrintPreviewModal>
      )}
    </>
  );
};
