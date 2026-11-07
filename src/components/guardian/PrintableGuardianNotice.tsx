/**
 * Official Printable Fee Demand Notice Component (إشعار / إنذار بمستحقات المصاريف المدرسية)
 * Formal printable notice replacing informal WhatsApp messages.
 * Includes official header banner, children list, due fees, deadline, and signatures.
 */

import React from 'react';
import { Guardian, Student } from '../../types';
import { StorageEngine } from '../../services/storage';

interface PrintableGuardianNoticeProps {
  guardian: Guardian;
  students: Student[];
  totalDues: number;
  deadlineDate?: string;
  notes?: string;
}

export const PrintableGuardianNotice: React.FC<PrintableGuardianNoticeProps> = ({
  guardian,
  students,
  totalDues,
  deadlineDate = '10 من الشهر القادم',
  notes
}) => {
  const classes = StorageEngine.getClasses();
  const grades = StorageEngine.getGrades();

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div
      dir="rtl"
      className="bg-white text-black p-4 sm:p-6 font-sans border-2 border-black rounded-2xl max-w-[210mm] mx-auto text-xs shadow-lg select-none"
    >
      {/* 1. Official Header Banner Image */}
      <div className="w-full pb-3 mb-4 border-b-2 border-[#1e1b4b]">
        <img
          src="/assets/aistudio/__________2026-10-22_161815_d10b3316.png"
          alt="ترويسة مجمع مدارس بكار الحرة"
          className="w-full max-h-24 object-contain mx-auto"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* 2. Notice Title */}
      <div className="my-3 bg-[#1e1b4b] text-white py-2 px-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-black shadow-sm">
        <span>إشعار بمستحقات المصاريف المدرسية</span>
        <span className="font-mono bg-white/20 px-3 py-0.5 rounded text-xs">{todayStr}</span>
        <span dir="ltr">AVIS DE RECOUVREMENT DES FRAIS</span>
      </div>

      {/* 3. Guardian Info Box */}
      <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50 mb-4 text-xs space-y-1.5 leading-relaxed">
        <div className="flex items-center justify-between">
          <span><strong>إلى السيد(ة) ولي الأمر: </strong>{guardian.nameAr} ({guardian.nameFr})</span>
          <span className="font-mono"><strong>الهاتف: </strong>{guardian.phone1}</span>
        </div>
        <div className="flex items-center justify-between text-slate-700">
          <span><strong>العلاقة: </strong>{guardian.relationship === 'father' ? 'الأب' : guardian.relationship === 'mother' ? 'الأم' : 'الوكيل الشرعي'}</span>
          <span><strong>العنوان: </strong>{guardian.address || 'نواكشوط'}</span>
        </div>
        <p className="text-slate-700 pt-1">
          تحية طيبة وبعد، نحيطكم علماً بضرورة تسوية المستحقات المالية المترتبة على الأبناء المذكورين أدناه قبل حلول الأجل المحدد، لضمان استمرار متابعتهم الدراسية بانتظام.
        </p>
      </div>

      {/* 4. Children & Amounts Table */}
      <table className="w-full text-xs text-right border-collapse border border-black mb-4">
        <thead className="bg-[#1e1b4b] text-white font-bold border-b border-black">
          <tr>
            <th className="p-2 border border-black text-center w-10">#</th>
            <th className="p-2 border border-black">اسم التلميذ(ة)</th>
            <th className="p-2 border border-black text-center w-28 font-mono">رقم القيد</th>
            <th className="p-2 border border-black text-center">المرحلة والقسم</th>
            <th className="p-2 border border-black text-center font-mono">الرسوم المستحقة (MRU)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/30 font-medium">
          {students.map((child, idx) => {
            const childClass = classes.find(c => c.id === child.classId);
            const childGrade = grades.find(g => g.id === child.gradeId);
            const invoices = StorageEngine.getInvoices(child.institutionId, child.id);
            const remaining = invoices
              .filter(inv => inv.status !== 'void')
              .reduce((sum, inv) => sum + inv.remainingAmount, 0);

            return (
              <tr key={child.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="p-2 border border-black text-center font-mono font-bold">{idx + 1}</td>
                <td className="p-2 border border-black font-bold">
                  {child.firstNameAr} {child.lastNameAr}
                  <span className="text-[10px] text-slate-500 block font-mono font-normal">{child.firstNameFr} {child.lastNameFr}</span>
                </td>
                <td className="p-2 border border-black text-center font-mono">{child.registrationNumber}</td>
                <td className="p-2 border border-black text-center">{childGrade?.nameAr || '—'} - {childClass?.nameAr || ''}</td>
                <td className="p-2 border border-black text-center font-mono font-bold text-base text-rose-900">
                  {remaining > 0 ? remaining.toLocaleString() : (child.customMonthlyFee || 2000).toLocaleString()} MRU
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-200 font-black border-t-2 border-black text-black">
            <td colSpan={4} className="p-2.5 text-left px-4 text-sm">
              المجموع الإجمالي المستحق للدفع (TOTAL DÛ):
            </td>
            <td className="p-2.5 border border-black text-center font-mono font-black text-base text-rose-950 bg-rose-50">
              {totalDues > 0 ? totalDues.toLocaleString() : (students.length * 2000).toLocaleString()} MRU
            </td>
          </tr>
        </tfoot>
      </table>

      {/* 5. Payment Deadline & Bank Instructions */}
      <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50 mb-5 text-xs space-y-2">
        <div className="flex items-center justify-between text-rose-900 font-bold">
          <span>آخر مهلة لتسديد المستحقات:</span>
          <span className="bg-white px-3 py-1 rounded-lg border border-rose-300 shadow-2xs font-mono">{deadlineDate}</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          طرق السداد المتاحة: نقداً في شباك المحاسبة بالمؤسسة، أو عبر التحويل المالي المباشر عبر تطبيق (بنكيلي / مصـرفي / كليك).
          يرجى إبراز هذا الإشعار أو إرسال وصل التحويل لأمين الصندوق لاعتماد المخالصة فوراً.
        </p>
      </div>

      {/* 6. Signatures & School Stamp */}
      <div className="grid grid-cols-2 gap-8 text-center text-xs font-bold pt-4 border-t-2 border-black">
        <div>
          <span className="underline block">قسم المحاسبة والخزينة</span>
          <span className="text-[10px] text-slate-500 font-normal">Service Comptabilité</span>
          <div className="h-12 mt-2"></div>
        </div>
        <div>
          <span className="underline block">المدير العام والختم الرسمي</span>
          <span className="text-[10px] text-slate-500 font-normal">Direction Générale</span>
          <div className="h-12 mt-2"></div>
        </div>
      </div>
    </div>
  );
};
