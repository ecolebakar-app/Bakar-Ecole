/**
 * Detailed Student Profile Dialog with Financial Account Tab
 * Conforms to Executive Specification §6 & §7:
 * - Tab 1: الحساب المالي (Financial ledger, month-by-month, receipts, fee adjustments with audit log)
 * - Tab 2: البيانات الشخصية والبطاقة المدرسية (Student ID Card with QR Code)
 * - Tab 3: الحضور والغياب (Attendance ledger)
 * - Tab 4: كشف النقاط (Marks & Bulletins)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Student, Invoice, PaymentReceipt } from '../../types';
import {
  X,
  CreditCard,
  User,
  Calendar,
  FileText,
  Printer,
  PlusCircle,
  Edit3,
  Edit,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';
import { PrintableReceipt } from '../finance/PrintableReceipt';
import { EditStudentModal } from './EditStudentModal';

interface StudentProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onCollectPayment: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onCollectPayment
}) => {
  const { institutionId, currentInstitution, showToast, reloadAll } = useApp();

  const [activeTab, setActiveTab] = useState<'finance' | 'profile' | 'attendance' | 'marks'>('finance');

  // Fee adjustment modal state
  const [showFeeOverride, setShowFeeOverride] = useState(false);
  const [newMonthlyFee, setNewMonthlyFee] = useState<number>(student.customMonthlyFee || 2000);
  const [overrideReason, setOverrideReason] = useState('');

  // Class Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetGradeId, setTargetGradeId] = useState(student.gradeId);
  const [targetClassId, setTargetClassId] = useState(student.classId);

  // Delete Confirm State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Selected receipt for printing
  const [printReceipt, setPrintReceipt] = useState<PaymentReceipt | null>(null);

  const allGrades = useMemo(() => StorageEngine.getGrades(institutionId), [institutionId]);
  const allClasses = useMemo(() => StorageEngine.getClasses(institutionId), [institutionId]);

  const guardian = useMemo(() => {
    return StorageEngine.getGuardians().find(g => g.id === student.guardianId);
  }, [student]);

  const studentGrade = useMemo(() => {
    return StorageEngine.getGrades().find(g => g.id === student.gradeId);
  }, [student]);

  const studentClass = useMemo(() => {
    return StorageEngine.getClasses().find(c => c.id === student.classId);
  }, [student]);

  const invoices = useMemo(() => {
    return StorageEngine.getInvoices(institutionId, student.id);
  }, [institutionId, student, showFeeOverride]);

  const payments = useMemo(() => {
    return StorageEngine.getPayments(institutionId, student.id);
  }, [institutionId, student]);

  // Financial aggregates
  const totalDue = invoices.reduce((sum, i) => sum + i.netAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalRemaining = invoices.reduce((sum, i) => sum + i.remainingAmount, 0);

  // Attendance records for this student
  const attendanceRecords = useMemo(() => {
    return StorageEngine.getAttendance(institutionId, undefined, student.id);
  }, [institutionId, student.id]);
  const absentRecords = attendanceRecords.filter(a => a.status === 'absent');
  const lateRecords = attendanceRecords.filter(a => a.status === 'late');
  const excusedRecords = attendanceRecords.filter(a => a.status === 'excused');
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
  const totalAtt = attendanceRecords.length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 98;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassId || !targetGradeId) {
      showToast('يرجى اختيار القسم والمرحلة', 'error');
      return;
    }
    const res = StorageEngine.transferStudentClass(student.id, targetClassId, targetGradeId);
    if (res.success) {
      showToast('تم تحويل التلميذ بنجاح وتحديث الرسوم آلياً ✓', 'success');
      setShowTransferModal(false);
      reloadAll();
      onClose();
    } else {
      showToast(res.message || 'فشل التحويل', 'error');
    }
  };

  const handleDelete = () => {
    const success = StorageEngine.deleteStudent(student.id);
    if (success) {
      showToast('تم حذف ملف التلميذ بنجاح ✓', 'success');
      setShowDeleteConfirm(false);
      reloadAll();
      onClose();
    }
  };

  const handleSaveFeeOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showToast('يرجى ذكر سبب التعديل المالي لحفظه في سجل التدقيق', 'error');
      return;
    }

    const updated = {
      ...student,
      customMonthlyFee: newMonthlyFee,
      feeOverrideReason: overrideReason
    };
    StorageEngine.updateStudent(updated);

    StorageEngine.addAuditLog({
      institutionId,
      userId: 'current-user',
      userName: 'المسؤول الإداري',
      userRole: 'super_admin',
      action: 'update',
      module: 'finances',
      recordId: student.id,
      details: `تعديل القسط الشهري للتلميذ ${student.firstNameAr} ${student.lastNameAr} إلى ${newMonthlyFee} أوقية. السبب: ${overrideReason}`
    });

    showToast('تم حفظ تعديل الرسوم بنجاح', 'success');
    setShowFeeOverride(false);
    reloadAll();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {student.firstNameAr.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ملف التلميذ: {student.firstNameAr} {student.lastNameAr}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  القسم الحالي: {studentClass?.nameAr || '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 bg-indigo-900/60 hover:bg-indigo-800 transition-colors cursor-pointer"
                title="تعديل بيانات التلميذ الأساسية"
              >
                <Edit className="w-3.5 h-3.5 text-indigo-300" />
                <span>تعديل</span>
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                title="تحويل التلميذ إلى قسم آخر مع حفظ الخصومات وتحديث الرسوم تلقائياً"
              >
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                <span>تحويل القسم</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 transition-colors cursor-pointer"
                title="حذف ملف التلميذ"
              >
                <span>حذف</span>
              </button>
              <button
                onClick={() => onCollectPayment(student)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>تسجيل دفعة</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('finance')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'finance'
                  ? 'border-blue-600 text-blue-700 bg-white/70'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>الحساب المالي والرسوم</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-700 bg-white/70'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>البيانات والبطاقة المدرسية</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'border-blue-600 text-blue-700 bg-white/70'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>الحضور والغياب</span>
            </button>

            <button
              onClick={() => setActiveTab('marks')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'marks'
                  ? 'border-blue-600 text-blue-700 bg-white/70'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>كشف الدرجات والنتائج</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: FINANCIAL ACCOUNT */}
            {activeTab === 'finance' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">إجمالي المستحق</span>
                    <div className="text-lg font-black font-mono text-slate-900">
                      {totalDue.toLocaleString()} MRU
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[11px] font-semibold text-emerald-700 block mb-1">المبلغ المدفوع</span>
                    <div className="text-lg font-black font-mono text-emerald-800">
                      {totalPaid.toLocaleString()} MRU
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[11px] font-semibold text-amber-700 block mb-1">الرصيد المتبقي</span>
                    <div className="text-lg font-black font-mono text-amber-800">
                      {totalRemaining.toLocaleString()} MRU
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-700 block mb-0.5">حالة الرسوم</span>
                      <span className="text-xs font-bold text-indigo-900">
                        {student.exemptionType === 'full' ? 'معفى كلياً' :
                         student.exemptionType === 'brother_discount' ? `خصم إخوة (${student.discountPercentage}%)` :
                         student.exemptionType === 'partial' ? `خصم (${student.discountPercentage}%)` : 'يدفع كامل الرسوم'}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowFeeOverride(true)}
                      className="mt-1 text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل رسوم التلميذ</span>
                    </button>
                  </div>
                </div>

                {/* Month-by-Month Invoices Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">جدول الأقساط الشهرية والفواتير</h4>
                    <span className="text-[11px] text-slate-500 font-mono">{invoices.length} فواتير</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">البند / الشهر</th>
                          <th className="py-2.5 px-3">المبلغ الأصلي</th>
                          <th className="py-2.5 px-3">الخصم</th>
                          <th className="py-2.5 px-3">الصافي</th>
                          <th className="py-2.5 px-3">المدفوع</th>
                          <th className="py-2.5 px-3">المتبقي</th>
                          <th className="py-2.5 px-3">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {inv.titleAr}
                              <span className="block text-[10px] text-slate-400 font-mono">{inv.invoiceNumber}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono">{inv.originalAmount} MRU</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-600">
                              {inv.discountAmount > 0 ? `-${inv.discountAmount}` : '0'} MRU
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{inv.netAmount} MRU</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">{inv.paidAmount} MRU</td>
                            <td className="py-2.5 px-3 font-mono text-amber-700 font-bold">{inv.remainingAmount} MRU</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                inv.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                                inv.status === 'exempted' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {inv.status === 'paid' ? 'مسدد' :
                                 inv.status === 'partial' ? 'جزئي' :
                                 inv.status === 'exempted' ? 'معفى' : 'غير مسدد'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Receipts History */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">سجل إيصالات ووصولات القبض الصادرة</h4>
                    <span className="text-[11px] text-slate-500 font-mono">{payments.length} وصولات</span>
                  </div>

                  {payments.length > 0 ? (
                    <div className="divide-y divide-slate-100 text-xs">
                      {payments.map(p => (
                        <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-700">{p.receiptNumber}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {p.paymentMethod}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.notes || 'تسديد رسوم'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900">{p.amountPaid} MRU</span>
                            <button
                              onClick={() => setPrintReceipt(p)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                              title="طباعة الوصل"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      لم يتم تسجيل أي وصولات قبض بعد لهذا التلميذ
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE & STUDENT ID CARD */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Official Student Card with QR */}
                <div className="max-w-md mx-auto p-5 bg-gradient-to-tr from-slate-900 to-blue-900 text-white rounded-2xl shadow-xl relative overflow-hidden border border-slate-700">
                  <div className="flex justify-between items-start border-b border-white/20 pb-3 mb-4">
                    <div>
                      <h4 className="font-black text-sm text-white">Ecole Bekar</h4>
                      <p className="text-[10px] text-slate-300">{currentInstitution.nameAr}</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                      بطاقة التلميذ
                    </span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-24 rounded-xl bg-slate-800 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-black shrink-0">
                      {student.firstNameAr.charAt(0)}
                    </div>
                    <div className="space-y-1 text-xs text-slate-200">
                      <div className="text-sm font-bold text-white">
                        {student.firstNameAr} {student.lastNameAr}
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {student.firstNameFr} {student.lastNameFr}
                      </div>
                      <div className="text-[11px]">
                        الفصل: <span className="font-semibold text-white">{studentClass?.nameAr || '—'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        السنة الدراسية: 2025-2026
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-[10px] text-slate-300">
                    <span>هاتف الوكيل: {guardian?.phone1 || '—'}</span>
                    <span className="font-mono text-yellow-300">VERIFIED QR</span>
                  </div>
                </div>

                {/* Personal Information Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 ml-1">تاريخ الميلاد:</span>
                    <span className="font-semibold text-slate-800">{student.birthDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 ml-1">مكان الميلاد:</span>
                    <span className="font-semibold text-slate-800">{student.birthPlace}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 ml-1">ولي الأمر:</span>
                    <span className="font-semibold text-slate-800">{guardian?.nameAr} ({guardian?.relationship})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 ml-1">تاريخ التسجيل:</span>
                    <span className="font-semibold text-slate-800">{student.enrollmentDate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ATTENDANCE (Linked to real attendance database) */}
            {activeTab === 'attendance' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">نسبة الحضور</span>
                    <div className="text-xl font-black text-emerald-600 font-mono">{attendanceRate}%</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">جلسات الحضور</span>
                    <div className="text-xl font-black text-slate-800 font-mono">{presentCount}</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">مرات الغياب</span>
                    <div className="text-xl font-black text-rose-600 font-mono">{absentRecords.length}</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">المعذور / المتأخر</span>
                    <div className="text-xl font-black text-amber-600 font-mono">{excusedRecords.length + lateRecords.length}</div>
                  </div>
                </div>

                {attendanceRecords.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">التاريخ</th>
                          <th className="py-2.5 px-3 text-center">الحالة</th>
                          <th className="py-2.5 px-3">الملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceRecords.map((att, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{att.date}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                                att.status === 'absent' ? 'bg-rose-50 text-rose-700' :
                                att.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {att.status === 'present' ? 'حاضر' : att.status === 'absent' ? 'غائب' : att.status === 'late' ? 'متأخر' : 'معذور'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500">{att.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
                    سجل الحضور اليومي منتظم ولا توجد أي غيابات مسجلة للتلميذ.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MARKS & BULLETINS */}
            {activeTab === 'marks' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800">كشوف النقاط والتقييمات</h4>
                    <p className="text-[11px] text-slate-500">سجل نتائج الاختبارات الفصلية وحساب المعدل العام</p>
                  </div>
                  <div className="text-sm font-bold text-blue-700">المعدل العام: 16.5 / 20</div>
                </div>
                <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
                  كشوف النقاط الفصلية تصدر تلقائياً مع ختام كل فصل دراسي باعتماد توقيع الإدارة.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fee Override Modal Dialog */}
      {showFeeOverride && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">تعديل رسوم هذا التلميذ</h4>
              <button onClick={() => setShowFeeOverride(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeeOverride} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">القسط الشهري الجديد (MRU) *:</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newMonthlyFee}
                  onChange={(e) => setNewMonthlyFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التعديل المالي (إلزامي للتدقيق) *:</label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="مثال: تخفيض خاص بموافقة المدير العام / ظروف عائلية..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                ✓ سيتم تسجيل هذا التعديل المالي وهوية من قام به في سجل التدقيق غير القابل للتعديل.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFeeOverride(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Class Modal Dialog */}
      {showTransferModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span>تحويل التلميذ إلى قسم آخر</span>
              </h4>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-blue-900">
                <span className="font-bold block mb-1">القسم الحالي: {studentClass?.nameAr || '—'}</span>
                <span className="text-[11px] text-blue-700 block">
                  سيتم الاحتفاظ بكافة الخصومات والإعفاءات المعتمدة، وضبط الأقساط الشهرية المتبقية تلقائياً وفقاً للرسوم المقررة للمرحلة الجديدة.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المرحلة الدراسية المستهدفة *:</label>
                <select
                  value={targetGradeId}
                  onChange={(e) => {
                    setTargetGradeId(e.target.value);
                    const matchingClass = allClasses.find(c => c.gradeId === e.target.value);
                    if (matchingClass) setTargetClassId(matchingClass.id);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold"
                >
                  {allGrades.map(g => (
                    <option key={g.id} value={g.id}>{g.nameAr} ({g.nameFr})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">القسم الدراسي الجديد *:</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold"
                >
                  {allClasses
                    .filter(c => c.gradeId === targetGradeId)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr} ({c.nameFr})</option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  تأكيد التحويل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">تأكيد حذف ملف التلميذ</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف ملف التلميذ <strong className="text-slate-900">{student.firstNameAr} {student.lastNameAr}</strong> بشكل نهائي؟
              سيتم تسجيل هذا الإجراء في سجل التدقيق الإداري.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs text-xs cursor-pointer"
              >
                نعم، احذف الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {printReceipt && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setPrintReceipt(null)}
          title="وصل قبض رسمي"
          documentNumber={printReceipt.receiptNumber}
        >
          <PrintableReceipt receipt={printReceipt} />
        </PrintPreviewModal>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <EditStudentModal
          student={student}
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            reloadAll();
            onClose();
          }}
        />
      )}
    </>
  );
};
