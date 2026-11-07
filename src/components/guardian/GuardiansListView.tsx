/**
 * Guardians Directory & Management View (دليل الوكلاء وأولياء الأمور)
 * Organized table with:
 * - Back button when inspecting a guardian's statement
 * - Printable formal fee notice (PrintableGuardianNotice)
 * - Search by name and phone
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Guardian, Student } from '../../types';
import {
  Users,
  Phone,
  Search,
  GraduationCap,
  ArrowRight,
  Printer,
  FileText,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { PrintableGuardianNotice } from './PrintableGuardianNotice';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';

export const GuardiansListView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, setActiveNav, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingGuardian, setInspectingGuardian] = useState<Guardian | null>(null);
  const [noticeGuardian, setNoticeGuardian] = useState<Guardian | null>(null);

  const guardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId]);
  const students = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId]);
  const invoices = useMemo(() => StorageEngine.getInvoices(institutionId), [institutionId]);

  const filteredGuardians = useMemo(() => {
    if (!searchQuery.trim()) return guardians;
    const q = searchQuery.toLowerCase().trim();
    return guardians.filter(g =>
      g.nameAr.includes(q) ||
      g.nameFr.toLowerCase().includes(q) ||
      g.phone1.includes(q) ||
      (g.phone2 && g.phone2.includes(q))
    );
  }, [guardians, searchQuery]);

  // If inspecting a specific guardian's statement, show detailed view with Back Button
  if (inspectingGuardian) {
    const guardianStudents = students.filter(s => s.guardianId === inspectingGuardian.id);
    const studentIds = guardianStudents.map(s => s.id);
    const guardianInvoices = invoices.filter(inv => studentIds.includes(inv.studentId) && inv.status !== 'void');
    const totalDue = guardianInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
    const totalPaid = guardianInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalRemaining = guardianInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Back Button Banner */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setInspectingGuardian(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى قائمة أولياء الأمور</span>
          </button>

          <button
            onClick={() => setNoticeGuardian(inspectingGuardian)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e1b4b] hover:bg-indigo-950 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة إشعار رسمي بالمستحقات</span>
          </button>
        </div>

        {/* Guardian Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-lg mb-1 inline-block">
                كشف الحساب العائلي الموحد
              </span>
              <h2 className="text-lg font-black text-slate-900">{inspectingGuardian.nameAr}</h2>
              <p className="text-xs text-slate-400 font-mono">{inspectingGuardian.nameFr}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-600">الهاتف: <strong className="font-mono text-slate-900">{inspectingGuardian.phone1}</strong></span>
              <span className="text-slate-600">العنوان: <strong className="text-slate-900">{inspectingGuardian.address || 'نواكشوط'}</strong></span>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-bold block mb-1">إجمالي الرسوم المفوترة</span>
              <div className="text-xl font-black font-mono text-slate-900">{totalDue.toLocaleString()} MRU</div>
            </div>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <span className="text-xs text-emerald-700 font-bold block mb-1">المبلغ المسدد</span>
              <div className="text-xl font-black font-mono text-emerald-800">{totalPaid.toLocaleString()} MRU</div>
            </div>
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
              <span className="text-xs text-rose-700 font-bold block mb-1">المتبقي المطلوب سداده</span>
              <div className="text-xl font-black font-mono text-rose-900">{totalRemaining.toLocaleString()} MRU</div>
            </div>
          </div>

          {/* Children List */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>الأبناء المسجلون ({guardianStudents.length}):</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {guardianStudents.map(child => {
                const childClass = classes.find(c => c.id === child.classId);
                return (
                  <div key={child.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{child.firstNameAr} {child.lastNameAr}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{child.registrationNumber}</span>
                    </div>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {childClass?.nameAr || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-2">فواتير ومستحقات الأقساط المدرسية</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">رقم الفاتورة</th>
                    <th className="py-2.5 px-3">التلميذ</th>
                    <th className="py-2.5 px-3">البيان</th>
                    <th className="py-2.5 px-3 text-center">المبلغ المستحق</th>
                    <th className="py-2.5 px-3 text-center">المسدد</th>
                    <th className="py-2.5 px-3 text-center">المتبقي</th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guardianInvoices.map(inv => {
                    const stu = guardianStudents.find(s => s.id === inv.studentId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 font-bold">{stu ? `${stu.firstNameAr} ${stu.lastNameAr}` : '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{inv.titleAr}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{inv.netAmount.toLocaleString()}</td>
                        <td className="py-2 px-3 text-center font-mono text-emerald-700">{inv.paidAmount.toLocaleString()}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-rose-700">{inv.remainingAmount.toLocaleString()}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            inv.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {inv.status === 'paid' ? 'مسدد بالكامل' : inv.status === 'partial' ? 'مسدد جزئياً' : 'غير مسدد'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notice Print Modal */}
        {noticeGuardian && (
          <PrintPreviewModal
            isOpen={true}
            onClose={() => setNoticeGuardian(null)}
            title={`إشعار رسمي بمستحقات المصاريف - ${noticeGuardian.nameAr}`}
          >
            <PrintableGuardianNotice
              guardian={noticeGuardian}
              students={guardianStudents}
              totalDues={totalRemaining}
            />
          </PrintPreviewModal>
        )}
      </div>
    );
  }

  // Main Table View
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              دليل أولياء الأمور
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">الوكلاء المعتمدون</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>سجل الوكلاء وأولياء الأمور (Répertoire des Tuteurs)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            جدول موحد لإدارة الوكلاء، ومتابعة الأبناء المرتبطين بهم، وإصدار إشعارات المطالبة المالية الرسمية
          </p>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
          إجمالي الوكلاء: {guardians.length} وكيل
        </span>
      </div>

      {/* Search Toolbar */}
      <div className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 absolute right-7 top-6.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم ولي الأمر، أو رقم الهاتف..."
          className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Organized Guardians Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">ولي الأمر (الوكيل)</th>
                <th className="py-3 px-4 text-center">الصفة</th>
                <th className="py-3 px-4 font-mono">رقم الهاتف</th>
                <th className="py-3 px-4">الأبناء المسجلون</th>
                <th className="py-3 px-4 text-center">المستحقات</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuardians.map((guardian, idx) => {
                const guardianStudents = students.filter(s => s.guardianId === guardian.id);
                const studentIds = guardianStudents.map(s => s.id);
                const guardianDues = invoices
                  .filter(inv => studentIds.includes(inv.studentId) && inv.status !== 'void')
                  .reduce((sum, inv) => sum + inv.remainingAmount, 0);

                return (
                  <tr key={guardian.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-center">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{guardian.nameAr}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{guardian.nameFr}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {guardian.relationship === 'father' ? 'الأب' :
                         guardian.relationship === 'mother' ? 'الأم' :
                         guardian.relationship === 'financial_sponsor' ? 'كفيل مالي' : 'وكيل شرعي'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      <a href={`tel:${guardian.phone1}`} className="hover:underline">
                        {guardian.phone1}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {guardianStudents.map(child => (
                          <span key={child.id} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10.5px] font-medium border border-indigo-100">
                            {child.firstNameAr} {child.lastNameAr}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold text-xs ${guardianDues > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {guardianDues.toLocaleString()} MRU
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setNoticeGuardian(guardian)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1e1b4b] hover:bg-indigo-950 text-white font-bold text-[11px] transition-colors cursor-pointer"
                          title="طباعة إشعار رسمي بمستحقات المصاريف"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>إشعار رسمي</span>
                        </button>
                        <button
                          onClick={() => setInspectingGuardian(guardian)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                          title="معاينة كشف الحساب العائلي الموحد"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                          <span>كشف الحساب</span>
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

      {/* Global Notice Print Modal */}
      {noticeGuardian && (() => {
        const guardianStudents = students.filter(s => s.guardianId === noticeGuardian.id);
        const studentIds = guardianStudents.map(s => s.id);
        const guardianDues = invoices
          .filter(inv => studentIds.includes(inv.studentId) && inv.status !== 'void')
          .reduce((sum, inv) => sum + inv.remainingAmount, 0);

        return (
          <PrintPreviewModal
            isOpen={true}
            onClose={() => setNoticeGuardian(null)}
            title={`إشعار رسمي بمستحقات المصاريف المدرسية - ${noticeGuardian.nameAr}`}
          >
            <PrintableGuardianNotice
              guardian={noticeGuardian}
              students={guardianStudents}
              totalDues={guardianDues}
            />
          </PrintPreviewModal>
        );
      })()}
    </div>
  );
};
