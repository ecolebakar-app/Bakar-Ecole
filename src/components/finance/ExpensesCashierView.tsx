/**
 * Expenses & Daily Cash Register View for Ecole Bekar
 * Conforms to Executive Specification §8.7, §8.8 & §8.11:
 * - Expenses management by category
 * - Daily Cash Register (الصندوق اليومي) & Cashier Day-End Closure
 * - Opening balance + Cash In - Cash Out = Expected Balance
 * - Actual counted cash verification & Variance detection (زيادة / عجز)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Expense, CashRegisterDay } from '../../types';
import {
  Wallet,
  Plus,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  Calendar,
  X
} from 'lucide-react';

export const ExpensesCashierView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, showToast, refreshKey, reloadAll } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'cashier'>('expenses');

  // Add Expense Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState<Expense['category']>('supplies');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expBeneficiary, setExpBeneficiary] = useState('');
  const [expMethod, setExpMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash');
  const [expApprovedBy, setExpApprovedBy] = useState('مدير المدرسة');

  // Cashier Day Closing Modal
  const [showCloseRegister, setShowCloseRegister] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [varianceReason, setVarianceReason] = useState('');
  const [cashierSignName, setCashierSignName] = useState('أمين الصندوق');

  const expenses = useMemo(() => {
    return StorageEngine.getExpenses(institutionId, sectionId);
  }, [institutionId, sectionId, refreshKey]);

  const cashRegisterToday = useMemo(() => {
    return StorageEngine.getCashRegisterToday(institutionId);
  }, [institutionId, refreshKey]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) {
      showToast('المبلغ يجب أن يكون أكبر من صفر', 'error');
      return;
    }

    StorageEngine.saveExpense({
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      academicYearId: 'year-2025-2026',
      category: expCategory,
      description: expDescription,
      amount: expAmount,
      paymentMethod: expMethod,
      expenseDate: new Date().toISOString().split('T')[0],
      beneficiary: expBeneficiary,
      approvedBy: expApprovedBy,
      isCancelled: false
    });

    showToast('تم تسجيل المصروف بنجاح وتحديث حركة الصندوق', 'success');
    setShowAddExpense(false);
    setExpDescription('');
    setExpAmount(0);
    setExpBeneficiary('');
    reloadAll();
  };

  const handleConfirmCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    StorageEngine.closeCashRegisterDay(
      institutionId,
      countedCash,
      cashierSignName,
      varianceReason || undefined
    );

    showToast('تم إقفال الصندوق اليومي بنجاح وتوثيق المحضر في سجل التدقيق', 'success');
    setShowCloseRegister(false);
    reloadAll();
  };

  const categoryLabels: Record<Expense['category'], string> = {
    salary: 'رواتب وأجور',
    rent: 'إيجار المقر',
    electricity: 'كهرباء وإنارة',
    water: 'مياه وخدمات',
    internet: 'إنترنت واتصالات',
    maintenance: 'صيانة وترميم',
    supplies: 'لوازم وقرطاسية',
    transport: 'وقود ونقل',
    other: 'مصروفات أخرى'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-600" />
            <span>إدارة المصروفات والصندوق اليومي - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل نفقات المؤسسة، ترحيل رصيد الخزينة، وإقفال اليومية مع كشف الفروقات
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'expenses' ? 'bg-white shadow-2xs text-rose-700' : 'text-slate-600'}`}
            >
              المصروفات والنفقات
            </button>
            <button
              onClick={() => setActiveTab('cashier')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'cashier' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-600'}`}
            >
              الصندوق اليومي وإقفال اليوم
            </button>
          </div>

          {activeTab === 'expenses' ? (
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مصروف</span>
            </button>
          ) : (
            !cashRegisterToday.isClosed && (
              <button
                onClick={() => {
                  setCountedCash(cashRegisterToday.expectedBalance);
                  setShowCloseRegister(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>إقفال الصندوق اليومي</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* TAB 1: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>سجل المصروفات المعتمدة ({expenses.length})</span>
              <span>السنة الدراسية: 2025-2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">رقم المصروف</th>
                    <th className="py-3 px-4">الفئة</th>
                    <th className="py-3 px-4">الوصف والبيان</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">طريقة الدفع</th>
                    <th className="py-3 px-4">المستفيد</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">المعتمد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length > 0 ? (
                    expenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-rose-700">{e.expenseNumber}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {categoryLabels[e.category] || e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{e.description}</td>
                        <td className="py-3 px-4 font-mono font-black text-rose-600">{e.amount.toLocaleString()} MRU</td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600">{e.paymentMethod === 'cash' ? 'نقدًا (الصندوق)' : e.paymentMethod}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{e.beneficiary}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{e.expenseDate}</td>
                        <td className="py-3 px-4 text-slate-600">{e.approvedBy}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        لا توجد مصروفات مسجلة حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY CASH REGISTER */}
      {activeTab === 'cashier' && (
        <div className="space-y-6">
          {/* Cash Register State Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    كشف حركة الصندوق اليومية بتاريخ: {cashRegisterToday.date}
                  </h3>
                  <p className="text-xs text-slate-500">
                    الحالة: {cashRegisterToday.isClosed ? 'مُقفل ومعتمد ✓' : 'مفتوح (جاري تسجيل العمليات)'}
                  </p>
                </div>
              </div>

              {cashRegisterToday.isClosed ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                  تم إقفال اليومية بواسطة {cashRegisterToday.closedBy}
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs animate-pulse">
                  اليومية مفتوحة
                </span>
              )}
            </div>

            {/* Reconciliation Balance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block mb-1">الرصيد الافتتاحي (بداية اليوم)</span>
                <div className="text-lg font-black font-mono text-slate-800">
                  {cashRegisterToday.openingBalance.toLocaleString()} MRU
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-700 block mb-1 flex items-center justify-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>المقبوضات النقدية الواردة (+)</span>
                </span>
                <div className="text-lg font-black font-mono text-emerald-700">
                  +{cashRegisterToday.totalCashIn.toLocaleString()} MRU
                </div>
              </div>

              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-700 block mb-1 flex items-center justify-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>المصروفات النقدية الصادرة (−)</span>
                </span>
                <div className="text-lg font-black font-mono text-rose-700">
                  −{cashRegisterToday.totalCashOut.toLocaleString()} MRU
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-xs text-blue-900 block mb-1 font-bold">الرصيد الدفتري المتوقع (=)</span>
                <div className="text-xl font-black font-mono text-blue-700">
                  {cashRegisterToday.expectedBalance.toLocaleString()} MRU
                </div>
              </div>
            </div>

            {/* Counted vs Variance (if closed) */}
            {cashRegisterToday.isClosed && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 ml-1">النقد الفعلي المعدود:</span>
                  <strong className="font-mono text-slate-900">{cashRegisterToday.countedBalance.toLocaleString()} MRU</strong>
                </div>
                <div>
                  <span className="text-slate-500 ml-1">الفارق (عجز / زيادة):</span>
                  <strong className={`font-mono font-bold ${cashRegisterToday.variance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {cashRegisterToday.variance > 0 ? `+${cashRegisterToday.variance}` : cashRegisterToday.variance} MRU
                  </strong>
                </div>
                {cashRegisterToday.varianceReason && (
                  <div>
                    <span className="text-slate-500 ml-1">سبب الفارق:</span>
                    <span>{cashRegisterToday.varianceReason}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">تسجيل سند صرف / مصروف جديد</h4>
              <button onClick={() => setShowAddExpense(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">فئة المصروف *:</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف المصروف والبيان *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء أحبار طابعة وأوراق امتحانات..."
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ (أوقية MRU) *:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الجهة المستفيدة *:</label>
                <input
                  type="text"
                  required
                  placeholder="اسم الشخص أو الشركة..."
                  value={expBeneficiary}
                  onChange={(e) => setExpBeneficiary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة الصرف *:</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="cash">نقدًا من الصندوق</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cheque">شيك مصرفي</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  اعتماد وحفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Cashier Day */}
      {showCloseRegister && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
              <Lock className="w-5 h-5 text-emerald-600" />
              <span>إقفال الصندوق اليومي ومطابقة النقد الفعلي</span>
            </div>

            <form onSubmit={handleConfirmCloseRegister} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                <span className="text-slate-500">الرصيد الدفتري المتوقع:</span>
                <span className="font-mono font-bold text-slate-900">
                  {cashRegisterToday.expectedBalance.toLocaleString()} MRU
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  المبلغ الفعلي المعدود في الخزينة (MRU) *:
                </label>
                <input
                  type="number"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-base"
                />
              </div>

              {countedCash !== cashRegisterToday.expectedBalance && (
                <div>
                  <div className={`p-2.5 rounded-xl border text-[11px] mb-2 ${
                    countedCash > cashRegisterToday.expectedBalance
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <strong>تنبيه فارق:</strong> يوجد فارق بمقدار {Math.abs(countedCash - cashRegisterToday.expectedBalance)} أوقية ({countedCash > cashRegisterToday.expectedBalance ? 'زيادة' : 'عجز'}).
                  </div>

                  <label className="block font-bold text-slate-700 mb-1">سبب الفارق المكتشف (إلزامي للتدقيق):</label>
                  <textarea
                    rows={2}
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                    placeholder="بيان سبب الفارق..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المراجع أو أمين الصندوق المعتمد:</label>
                <input
                  type="text"
                  required
                  value={cashierSignName}
                  onChange={(e) => setCashierSignName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloseRegister(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  تأكيد الإقفال واعتماد المحضر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
