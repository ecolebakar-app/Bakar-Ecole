/**
 * Dedicated Guardian Portal View for Ecole Bekar
 * Conforms to Executive Specification §6.4:
 * - Mobile-first interface for parents / guardians
 * - Strictly isolated view: Parent sees ONLY their children
 * - Outstanding dues, invoices, and digital payment receipts
 * - Intention of payment registration
 * - Printable Statement of Account (كشف حساب الوكيل الشهري §9.6)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Guardian, Student } from '../../types';
import {
  HeartHandshake,
  User,
  GraduationCap,
  CreditCard,
  Receipt,
  Printer,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';

export const GuardianPortalView: React.FC = () => {
  const { institutionId, currentInstitution, showToast, refreshKey } = useApp();

  const guardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId, refreshKey]);
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>(() => {
    return guardians[0]?.id || '';
  });

  // Switch to first guardian if selection is empty
  React.useEffect(() => {
    if (guardians.length > 0 && (!selectedGuardianId || !guardians.some(g => g.id === selectedGuardianId))) {
      setSelectedGuardianId(guardians[0].id);
    }
  }, [guardians, selectedGuardianId]);

  const activeGuardian = useMemo(() => {
    return guardians.find(g => g.id === selectedGuardianId) || guardians[0];
  }, [guardians, selectedGuardianId]);

  // Guardian's children
  const children = useMemo(() => {
    if (!activeGuardian) return [];
    return StorageEngine.getStudents(institutionId).filter(s => s.guardianId === activeGuardian.id);
  }, [activeGuardian, institutionId, refreshKey]);

  // Invoices for all guardian's children
  const guardianInvoices = useMemo(() => {
    if (!activeGuardian) return [];
    return StorageEngine.getInvoices(institutionId).filter(i => i.guardianId === activeGuardian.id);
  }, [activeGuardian, institutionId, refreshKey]);

  // Receipts
  const guardianReceipts = useMemo(() => {
    if (!activeGuardian) return [];
    return StorageEngine.getPayments(institutionId).filter(p => p.guardianId === activeGuardian.id);
  }, [activeGuardian, institutionId, refreshKey]);

  // Notifications for this guardian
  const guardianNotifs = useMemo(() => {
    if (!activeGuardian) return [];
    return StorageEngine.getNotifications(institutionId, activeGuardian.id);
  }, [activeGuardian, institutionId, refreshKey]);

  const totalDue = guardianInvoices.reduce((acc, i) => acc + i.netAmount, 0);
  const totalPaid = guardianInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalRemaining = guardianInvoices.reduce((acc, i) => acc + i.remainingAmount, 0);

  // Statement Print Preview modal
  const [showStatementPrint, setShowStatementPrint] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Account Switcher */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
              بوابة أولياء الأمور
            </span>
            <span className="text-xs text-slate-300 font-mono">Ecole Bekar Guardian Portal</span>
          </div>
          <h1 className="text-xl font-black">
            مرحباً بك، {activeGuardian?.nameAr || 'ولي الأمر المحترم'}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            متابعة فورية للحساب المالي والأداء الدراسي لأبنائكم في {currentInstitution.nameAr}
          </p>
        </div>

        {/* Guardian Simulator Picker */}
        <div className="bg-white/10 p-2 rounded-xl backdrop-blur border border-white/20 text-xs">
          <label className="block text-[10px] text-slate-300 mb-1">معاينة حساب ولي أمر آخر:</label>
          <select
            value={selectedGuardianId}
            onChange={(e) => setSelectedGuardianId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs border border-white/20 focus:outline-hidden cursor-pointer"
          >
            {guardians.map(g => (
              <option key={g.id} value={g.id}>{g.nameAr} ({g.phone1})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Health for Guardian */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">المستحق الإجمالي (كافة الأبناء)</span>
          <div className="text-xl font-black font-mono text-slate-900">
            {totalDue.toLocaleString()} MRU
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-700 block mb-1">إجمالي ما تم سداده</span>
          <div className="text-xl font-black font-mono text-emerald-700">
            {totalPaid.toLocaleString()} MRU
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-amber-700 block mb-1">الرصيد المتبقي المستحق</span>
          <div className="text-xl font-black font-mono text-amber-700">
            {totalRemaining.toLocaleString()} MRU
          </div>
        </div>
      </div>

      {/* Children Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>الأبناء المسجلون في المؤسسة ({children.length})</span>
          </h2>
          <button
            onClick={() => setShowStatementPrint(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>طباعة كشف الحساب الشهري</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map(child => {
            const childInvoices = guardianInvoices.filter(i => i.studentId === child.id);
            const childRemaining = childInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);

            return (
              <div key={child.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      {child.firstNameAr.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {child.firstNameAr} {child.lastNameAr}
                      </h3>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    childRemaining === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {childRemaining === 0 ? 'مسدد بالكامل ✓' : `متبقي ${childRemaining} MRU`}
                  </span>
                </div>

                {/* Invoices List for Child */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="font-bold text-[11px] text-slate-600 block mb-1">حالة الأقساط الشهرية:</span>
                  {childInvoices.map(inv => (
                    <div key={inv.id} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-none">
                      <span className="text-slate-700">{inv.titleAr}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-800">{inv.netAmount} MRU</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                          inv.status === 'exempted' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status === 'paid' ? 'تم الدفع' :
                           inv.status === 'partial' ? 'جزئي' :
                           inv.status === 'exempted' ? 'معفى' : 'مستحق'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">حالة الرسوم:</span>
                  <span className="font-bold text-indigo-700">
                    {child.exemptionType === 'brother_discount' ? 'مستفيد من خصم الإخوة (15%)' :
                     child.exemptionType === 'full' ? 'إعفاء كلي' : 'عادي'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guardian Inbox & Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbox */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-xs">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>صندوق إشعارات الوكيل ({guardianNotifs.length})</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {guardianNotifs.length > 0 ? (
              guardianNotifs.map(n => (
                <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{n.titleAr}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{n.messageAr}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                لا توجد إشعارات جديدة في صندوقك
              </div>
            )}
          </div>
        </div>

        {/* Payments & Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-xs">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>وصولات القبض الصادرة لك ({guardianReceipts.length})</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {guardianReceipts.length > 0 ? (
              guardianReceipts.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-mono font-bold text-blue-700">{r.receiptNumber}</div>
                    <div className="text-[10px] text-slate-400">{r.paymentDate} - {r.paymentMethod}</div>
                  </div>
                  <div className="font-mono font-black text-emerald-700">
                    {r.amountPaid} MRU
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                لم يتم إصدار وصولات قبض بعد
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Statement of Account Modal (§9.6) */}
      {showStatementPrint && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setShowStatementPrint(false)}
          title="كشف حساب الوكيل الشهري"
          documentNumber={`STAT-${activeGuardian.id}`}
        >
          <div className="space-y-6 text-slate-900 text-xs">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black">Ecole Bekar</h2>
                <h3 className="text-xs font-bold text-slate-700">{currentInstitution.nameAr}</h3>
                <p className="text-[10px] text-slate-500 font-mono">هاتف: {currentInstitution.phone}</p>
              </div>
              <div className="text-center">
                <span className="text-sm font-black px-3 py-1 bg-slate-900 text-white rounded-lg block">
                  كشف حساب الوكيل (RELEVÉ DE COMPTE)
                </span>
                <span className="text-[11px] font-mono text-slate-600 font-bold mt-1 block">
                  السنة الدراسية: 2025-2026
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 ml-1">اسم الوكيل:</span>
                <strong className="text-slate-900">{activeGuardian.nameAr}</strong>
              </div>
              <div>
                <span className="text-slate-500 ml-1">رقم الهاتف:</span>
                <strong className="font-mono">{activeGuardian.phone1}</strong>
              </div>
              <div>
                <span className="text-slate-500 ml-1">عدد الأبناء المسجلين:</span>
                <strong>{children.length} تلاميذ</strong>
              </div>
              <div>
                <span className="text-slate-500 ml-1">تاريخ الكشف:</span>
                <strong className="font-mono">{new Date().toLocaleDateString()}</strong>
              </div>
            </div>

            {/* Invoices Details */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="p-2 border border-slate-300 text-right">التلميذ</th>
                  <th className="p-2 border border-slate-300 text-right">البند / الشهر</th>
                  <th className="p-2 border border-slate-300 text-right">المستحق</th>
                  <th className="p-2 border border-slate-300 text-right">المدفوع</th>
                  <th className="p-2 border border-slate-300 text-right">المتبقي (MRU)</th>
                </tr>
              </thead>
              <tbody>
                {guardianInvoices.map(inv => {
                  const s = children.find(c => c.id === inv.studentId);
                  return (
                    <tr key={inv.id}>
                      <td className="p-2 border border-slate-200 font-bold">{s ? `${s.firstNameAr} ${s.lastNameAr}` : '—'}</td>
                      <td className="p-2 border border-slate-200">{inv.titleAr}</td>
                      <td className="p-2 border border-slate-200 font-mono">{inv.netAmount}</td>
                      <td className="p-2 border border-slate-200 font-mono text-emerald-700">{inv.paidAmount}</td>
                      <td className="p-2 border border-slate-200 font-mono font-black">{inv.remainingAmount}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan={4} className="p-2.5 border border-slate-300 text-left pl-4">
                    إجمالي الرصيد المتبقي على الوكيل:
                  </td>
                  <td className="p-2.5 border border-slate-300 font-mono font-black text-sm text-slate-900">
                    {totalRemaining.toLocaleString()} MRU
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-600">
              <div>
                <span className="font-bold block mb-12">توقيع المحاسب</span>
                <span className="border-t border-slate-300 pt-1 block">إدارة الشؤون المالية</span>
              </div>
              <div>
                <span className="font-bold block mb-12">خاتم المؤسسة</span>
                <span className="border-t border-slate-300 pt-1 block">Ecole Bekar</span>
              </div>
            </div>
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
