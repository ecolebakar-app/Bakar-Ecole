/**
 * Annual Tuition & Registration Fees View (الرسوم السنوية ورسوم التسجيل)
 * Features:
 * 1. "الرسوم السنوية" (Annual Monthly Installments Matrix):
 *    - Explicit month selection to pay (e.g. October, November, December, etc.)
 *    - Custom Active/Billable Months per Student:
 *      A student can register in October and return only in February; non-studied months
 *      are strictly flagged as "لم يدرس فيه (معفى - غير مستحق)" with 0 MRU due!
 *    - Dedicated individual month customization modal ("تعديل أشهر الدفع والاستحقاق")
 *    - Bulk month customization for ALL students or by class ("تعديل جماعي لأشهر الاستحقاق")
 * 2. "رسوم التسجيل" (Registration Fees):
 *    - Dedicated section for registration fees, discounts, and exemptions.
 * 3. Direct quick payment integration & receipt issuance.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Student, Invoice } from '../../types';
import {
  Calendar,
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  Receipt,
  UserCheck,
  ChevronDown,
  Edit3,
  Sliders,
  Users,
  Check,
  X
} from 'lucide-react';

export const ACADEMIC_MONTHS = [
  { key: 'oct', nameAr: 'أكتوبر', order: 1, monthNumber: 10 },
  { key: 'nov', nameAr: 'نوفمبر', order: 2, monthNumber: 11 },
  { key: 'dec', nameAr: 'ديسمبر', order: 3, monthNumber: 12 },
  { key: 'jan', nameAr: 'يناير', order: 4, monthNumber: 1 },
  { key: 'feb', nameAr: 'فبراير', order: 5, monthNumber: 2 },
  { key: 'mar', nameAr: 'مارس', order: 6, monthNumber: 3 },
  { key: 'apr', nameAr: 'إبريل', order: 7, monthNumber: 4 },
  { key: 'may', nameAr: 'مايو', order: 8, monthNumber: 5 },
  { key: 'jun', nameAr: 'يونيو', order: 9, monthNumber: 6 },
];

export const AnnualTuitionView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, setQuickPaymentOpen, showToast, reloadAll, refreshKey } = useApp();

  const [activeTab, setActiveTab] = useState<'annual_tuition' | 'registration_fees'>('annual_tuition');
  const [selectedMonth, setSelectedMonth] = useState<string>('oct');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Modal 1: Individual Student Months Edit
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentMonths, setStudentMonths] = useState<string[]>([]);

  // Modal 2: Bulk Edit Months for All or by Class
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | 'class'>('all');
  const [bulkTargetClass, setBulkTargetClass] = useState<string>('');
  const [bulkMonths, setBulkMonths] = useState<string[]>(ACADEMIC_MONTHS.map(m => m.key));

  const students = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const grades = useMemo(() => StorageEngine.getGrades(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const invoices = useMemo(() => StorageEngine.getInvoices(institutionId), [institutionId, refreshKey]);
  const feeStructures = useMemo(() => StorageEngine.getFeeStructures(institutionId), [institutionId, refreshKey]);

  // Check if a specific month is active/billable for a student
  const isMonthBillable = (student: Student, monthKey: string): boolean => {
    // If student has explicit activeBillableMonths defined
    if (student.activeBillableMonths !== undefined) {
      return student.activeBillableMonths.includes(monthKey);
    }
    // Default: all 9 months are billable unless restricted
    return true;
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (filterClass !== 'all' && s.classId !== filterClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = s.firstNameAr.includes(q) || s.lastNameAr.includes(q) ||
          s.registrationNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [students, filterClass, searchQuery]);

  // Open individual edit modal
  const handleOpenStudentMonths = (student: Student) => {
    setEditingStudent(student);
    if (student.activeBillableMonths !== undefined) {
      setStudentMonths([...student.activeBillableMonths]);
    } else {
      setStudentMonths(ACADEMIC_MONTHS.map(m => m.key));
    }
  };

  // Save individual student months
  const handleSaveStudentMonths = () => {
    if (!editingStudent) return;
    const updated: Student = {
      ...editingStudent,
      activeBillableMonths: [...studentMonths]
    };
    StorageEngine.updateStudent(updated);
    showToast(`تم تحديث أشهر الاستحقاق والدراسة لـ ${editingStudent.firstNameAr} بنجاح (${studentMonths.length} أشهر)`, 'success');
    setEditingStudent(null);
    reloadAll();
  };

  // Save bulk months for all or by class
  const handleSaveBulkMonths = () => {
    let targetStudents = students;
    if (bulkScope === 'class') {
      if (!bulkTargetClass) {
        showToast('يرجى اختيار القسم المستهدف', 'error');
        return;
      }
      targetStudents = students.filter(s => s.classId === bulkTargetClass);
    }

    if (targetStudents.length === 0) {
      showToast('لم يتم العثور على تلاميذ لتطبيق التعديل عليهم', 'error');
      return;
    }

    const targetIds = targetStudents.map(s => s.id);
    StorageEngine.bulkUpdateBillableMonths(targetIds, bulkMonths);
    showToast(`تم تحديث أشهر الاستحقاق بنجاح لعدد ${targetStudents.length} تلميذ (${bulkMonths.length} أشهر مستحقة)`, 'success');
    setShowBulkModal(false);
    reloadAll();
  };

  const toggleStudentMonth = (key: string) => {
    if (studentMonths.includes(key)) {
      setStudentMonths(studentMonths.filter(k => k !== key));
    } else {
      setStudentMonths([...studentMonths, key]);
    }
  };

  const toggleBulkMonth = (key: string) => {
    if (bulkMonths.includes(key)) {
      setBulkMonths(bulkMonths.filter(k => k !== key));
    } else {
      setBulkMonths([...bulkMonths, key]);
    }
  };

  // Direct 1-click toggle of a month for a student right from the table
  const handleDirectToggleStudentMonth = (student: Student, monthKey: string) => {
    const currentMonths = student.activeBillableMonths !== undefined
      ? [...student.activeBillableMonths]
      : ACADEMIC_MONTHS.map(m => m.key);

    const isCurrentlyActive = currentMonths.includes(monthKey);
    const newMonths = isCurrentlyActive
      ? currentMonths.filter(k => k !== monthKey)
      : [...currentMonths, monthKey];

    const updated: Student = {
      ...student,
      activeBillableMonths: newMonths
    };

    StorageEngine.updateStudent(updated);
    const monthObj = ACADEMIC_MONTHS.find(m => m.key === monthKey);
    showToast(
      isCurrentlyActive
        ? `تم تعطيل شهر ${monthObj?.nameAr} لـ ${student.firstNameAr} (0 MRU - معفى)`
        : `تم تفعيل شهر ${monthObj?.nameAr} لـ ${student.firstNameAr} (مستحق الدفع)`,
      'info'
    );
    reloadAll();
  };

  return (
    <div className="space-y-6">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              إدارة الرسوم المدرسية والأقساط المرنة
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">العملة: MRU</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>الرسوم السنوية وأشهر الاستحقاق - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            تحديد أشهر الدراسة الفعلية لكل طالب بدقة (الأشهر غير المدروسة معفاة ولا تُحسب كدين)، مع إمكانية التعديل الفردي والجماعي للكل.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold shadow-2xs">
          <button
            onClick={() => setActiveTab('annual_tuition')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'annual_tuition' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>الرسوم السنوية (الأشهر)</span>
          </button>
          <button
            onClick={() => setActiveTab('registration_fees')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'registration_fees' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>رسوم التسجيل</span>
          </button>
        </div>
      </div>

      {activeTab === 'annual_tuition' ? (
        <div className="space-y-5">
          {/* Top Actions: Month Selector Pills & Bulk Edit Trigger */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>اختر الشهر لمعاينة الدفع أو تسديده:</span>
              </span>

              {/* Bulk Edit Button (Requested: ضف خاصية التعديل للكل ليست هي فقط) */}
              <button
                onClick={() => {
                  if (classes.length > 0 && !bulkTargetClass) setBulkTargetClass(classes[0].id);
                  setShowBulkModal(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تعديل جماعي لأشهر الاستحقاق (الكل / حسب القسم)</span>
              </button>
            </div>

            {/* Months Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {ACADEMIC_MONTHS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMonth(m.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedMonth === m.key
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs scale-102 ring-2 ring-blue-400/30'
                      : 'bg-slate-50/80 text-slate-600 hover:bg-slate-100 border border-slate-200/90 hover:text-slate-900'
                  }`}
                >
                  {m.nameAr}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم التلميذ..."
                className="w-full pr-10 pl-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-hidden transition-all shadow-2xs placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full appearance-none pr-3.5 pl-9 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-hidden transition-all shadow-2xs cursor-pointer"
              >
                <option value="all">كل الفصول والأقسام</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nameAr} ({c.nameFr})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Tuition Status Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">الرقم</th>
                    <th className="py-3.5 px-4">اسم التلميذ</th>
                    <th className="py-3.5 px-4">القسم</th>
                    <th className="py-3.5 px-4 text-center">أشهر الدراسة الفعلية</th>
                    <th className="py-3.5 px-4 text-center">موقف شهر {ACADEMIC_MONTHS.find(m => m.key === selectedMonth)?.nameAr}</th>
                    <th className="py-3.5 px-4 text-center">المبلغ المستحق</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const stuClass = classes.find(c => c.id === student.classId);
                    const selectedMonthObj = ACADEMIC_MONTHS.find(m => m.key === selectedMonth)!;
                    const billableThisMonth = isMonthBillable(student, selectedMonthObj.key);

                    // Check invoice for this month
                    const monthInv = invoices.find(i =>
                      i.studentId === student.id &&
                      i.feeCategory === 'monthly' &&
                      i.titleAr.includes(selectedMonthObj.nameAr)
                    );

                    const feePlan = feeStructures.find(f => f.gradeId === student.gradeId);
                    const monthlyRate = student.customMonthlyFee || feePlan?.monthlyFee || 2000;

                    let statusBadge = (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                        غير مسدد
                      </span>
                    );

                    if (!billableThisMonth) {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          لم يدرس (معفى - غير مستحق)
                        </span>
                      );
                    } else if (monthInv && monthInv.remainingAmount === 0) {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                          تم السداد ✓
                        </span>
                      );
                    }

                    const activeMonthsCount = student.activeBillableMonths !== undefined
                      ? student.activeBillableMonths.length
                      : 9;

                    return (
                      <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-950 transition-colors">
                          {student.firstNameAr} {student.lastNameAr}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{stuClass?.nameAr || '—'}</td>

                        {/* Active Billable Months Indicator with quick edit trigger & mini interactive pills */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <button
                              onClick={() => handleOpenStudentMonths(student)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200/70 transition-all cursor-pointer"
                              title="تعديل أشهر الدراسة والاستحقاق لهذا التلميذ"
                            >
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span>{activeMonthsCount} من 9 أشهر مستحقة</span>
                              <Edit3 className="w-2.5 h-2.5 text-blue-500 ml-0.5" />
                            </button>

                            {/* Miniature 1-click interactive month chips */}
                            <div className="flex items-center gap-0.5 flex-wrap justify-center max-w-[220px]">
                              {ACADEMIC_MONTHS.map(m => {
                                const isBillable = isMonthBillable(student, m.key);
                                return (
                                  <button
                                    key={m.key}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDirectToggleStudentMonth(student, m.key);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer ${
                                      isBillable
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 line-through border border-slate-200'
                                    }`}
                                    title={`انقر لتفعيل أو تعطيل ${m.nameAr} (${isBillable ? 'مستحق' : 'معفى 0 MRU'})`}
                                  >
                                    {m.nameAr.slice(0, 3)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">{statusBadge}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                          {!billableThisMonth ? '0 MRU' : `${monthlyRate.toLocaleString()} MRU`}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {billableThisMonth && (!monthInv || monthInv.remainingAmount > 0) ? (
                              <button
                                onClick={() => setQuickPaymentOpen(true)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                <span>تسديد الشهر</span>
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleOpenStudentMonths(student)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="تعديل أشهر الاستحقاق"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: Registration Fees */
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                موقف رسوم التسجيل لكافة التلاميذ ({students.length} تلميذ)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">الرقم</th>
                    <th className="py-3.5 px-4">اسم التلميذ</th>
                    <th className="py-3.5 px-4">تاريخ التسجيل</th>
                    <th className="py-3.5 px-4 text-center">رسم التسجيل</th>
                    <th className="py-3.5 px-4 text-center">نوع الإعفاء / الخصم</th>
                    <th className="py-3.5 px-4 text-center">الحالة</th>
                    <th className="py-3.5 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const regInv = invoices.find(i => i.studentId === student.id && i.feeCategory === 'registration');
                    const isPaid = regInv ? regInv.remainingAmount === 0 : false;

                    return (
                      <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-950 transition-colors">{student.firstNameAr} {student.lastNameAr}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{student.enrollmentDate}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {regInv?.netAmount || 1500} MRU
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 shadow-2xs">
                            {student.exemptionType === 'brother_discount' ? 'خصم إخوة 15%' :
                             student.exemptionType === 'scholarship' ? 'منحة تفوق' :
                             student.exemptionType === 'full' ? 'إعفاء كامل' : 'عادي'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isPaid ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                              مسدد بالكامل ✓
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                              غير مسدد
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {!isPaid ? (
                            <button
                              onClick={() => setQuickPaymentOpen(true)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <span>قبض الرسم</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold">مقبوض ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Individual Student Active Billable Months Editor */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>تعديل أشهر الدراسة والاستحقاق الفعلي</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  التلميذ: <strong className="text-slate-900">{editingStudent.firstNameAr} {editingStudent.lastNameAr}</strong>
                  {editingStudent.nationalId && <span className="font-mono text-slate-400 mr-2">(NNI: {editingStudent.nationalId})</span>}
                </p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>قاعدة الاستحقاق المرن: </strong>
                إذا سجل التلميذ مثلاً شهر أكتوبر وخرج ليعود في فبراير، حدد فقط الأشهر التي درس فيها. الأشهر غير المحددة تصبح معفاة تماماً وتُحسب بـ 0 MRU دون تسجيل أي دين!
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">خيارات التحديد السريع:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStudentMonths(ACADEMIC_MONTHS.map(m => m.key))}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                >
                  جميع الأشهر (9 أشهر)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMonths(['oct', 'nov', 'dec'])}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  الفصل 1 (أكتوبر - ديسمبر)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMonths(['jan', 'feb', 'mar'])}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  الفصل 2 (يناير - مارس)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMonths(['apr', 'may', 'jun'])}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  الفصل 3 (أبريل - يونيو)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMonths([])}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                >
                  إلغاء التحديد (0 أشهر - معفى)
                </button>
              </div>
            </div>

            {/* Months Grid Checkboxes */}
            <div className="grid grid-cols-3 gap-2.5">
              {ACADEMIC_MONTHS.map(m => {
                const isSelected = studentMonths.includes(m.key);
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleStudentMonth(m.key)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m.nameAr}</span>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center ${isSelected ? 'bg-white text-blue-600' : 'border border-slate-300'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600">
                المجموع المحدد: <strong className="text-blue-700 font-mono">{studentMonths.length} أشهر</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentMonths}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  حفظ وتطبيق التعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Edit Billable Months for ALL or by Class */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>تعديل جماعي لأشهر الاستحقاق (لكل الطلاب أو حسب القسم)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تحديد أشهر الدفع المستحقة لمجموعة من الطلاب دفعة واحدة
                </p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">النطاق المستهدف للتعديل الجماعي:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkScope('all')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    bulkScope === 'all'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>كافة طلاب المؤسسة ({students.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('class')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    bulkScope === 'class'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>حسب قسم دراسي محدد</span>
                </button>
              </div>

              {bulkScope === 'class' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">حدد القسم:</label>
                  <select
                    value={bulkTargetClass}
                    onChange={(e) => setBulkTargetClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr} ({c.nameFr})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Months Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">الأشهر المستحقة المراد تطبيقها:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setBulkMonths(ACADEMIC_MONTHS.map(m => m.key))}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    تحديد الكل (9)
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBulkMonths(['oct', 'nov', 'dec'])}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    ف1
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBulkMonths(['jan', 'feb', 'mar'])}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    ف2
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBulkMonths(['apr', 'may', 'jun'])}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    ف3
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBulkMonths([])}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    إلغاء الكل (0)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ACADEMIC_MONTHS.map(m => {
                  const isSelected = bulkMonths.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleBulkMonth(m.key)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.nameAr}</span>
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${isSelected ? 'bg-white text-indigo-600' : 'border border-slate-300'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600">
                أشهر مفعلة: <strong className="text-indigo-700 font-mono">{bulkMonths.length} أشهر</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkMonths}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-xs"
                >
                  تطبيق التعديل على الكل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
