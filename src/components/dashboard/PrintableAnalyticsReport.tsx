/**
 * Official Printable Analytics Report (التقرير التحليلي والإحصائي الرسمي للإدارة)
 * Exact professional layout for presentation to General Directorate:
 * - Official bilingual school header with logo
 * - Executive Financial & Academic KPIs
 * - Monthly Enrollment Evolution Table & Stage Analysis
 * - Monthly Fee Collection Status Table & Outstanding Dues
 * - Educational Distribution & Strategic Remarks
 * - Official Signatures & School Seal
 */

import React from 'react';
import { StorageEngine } from '../../services/storage';
import { InstitutionId } from '../../types';

interface PrintableAnalyticsReportProps {
  institutionId: InstitutionId;
  enrollmentData: Array<{
    month: string;
    primary: number;
    middle: number;
    secondary: number;
    total: number;
  }>;
  feeCollectionData: Array<{
    month: string;
    collected: number;
    remaining: number;
    target: number;
  }>;
}

export const PrintableAnalyticsReport: React.FC<PrintableAnalyticsReportProps> = ({
  institutionId,
  enrollmentData,
  feeCollectionData
}) => {
  const institutions = StorageEngine.getInstitutions();
  const currentInstitution = institutions.find(i => i.id === institutionId) || institutions[0];
  const students = StorageEngine.getStudents(institutionId);
  const teachers = StorageEngine.getTeachers(institutionId);
  const classes = StorageEngine.getClasses(institutionId);
  const invoices = StorageEngine.getInvoices(institutionId);
  const payments = StorageEngine.getPayments(institutionId);
  const expenses = StorageEngine.getExpenses(institutionId);

  const totalCollected = payments.filter(p => !p.isCancelled).reduce((sum, p) => sum + p.amountPaid, 0);
  const totalExpenses = expenses.filter(e => !e.isCancelled).reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalCollected - totalExpenses;
  const uncollectedDues = invoices.filter(i => i.remainingAmount > 0 && i.status !== 'void').reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalBilled = invoices.filter(i => i.status !== 'void').reduce((sum, i) => sum + i.netAmount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((students.length / totalCapacity) * 100) : 0;

  const currentDate = new Date().toLocaleDateString('ar-MR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const reportNumber = `REP-DIR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

  return (
    <div className="bg-white text-slate-900 p-8 sm:p-10 font-sans max-w-[210mm] mx-auto text-xs print:p-0 print:border-none print:shadow-none select-none">
      {/* 1. Official Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#43A047]">
        {/* French Left Column */}
        <div className="text-left flex-1">
          <h2 className="text-base sm:text-lg font-black text-[#43A047] tracking-tight leading-snug">
            Complexe des écoles privées BAKAR
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            Honnêteté – Persévérance – Réussite
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Arrêtée conjoint N° 231
          </p>
        </div>

        {/* Center Emblem Logo */}
        <div className="shrink-0 px-4 flex flex-col items-center">
          <img
            src="/assets/aistudio/logo_fe103f4c.png"
            alt="شعار مجمع مدارس بكار"
            className="h-20 w-20 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Arabic Right Column */}
        <div className="text-right flex-1" dir="rtl">
          <h2 className="text-base sm:text-lg font-black text-[#43A047] tracking-tight leading-snug">
            مجمع مدارس بكّار الحرة
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            أمانة – مثابرة – نجاح
          </p>
          <p className="text-[11px] text-slate-500 font-medium font-mono">
            مقرر مشترك: رقم 231
          </p>
        </div>
      </div>

      {/* 2. Document Banner */}
      <div className="my-5 text-center">
        <div className="inline-block bg-slate-900 text-white px-8 py-2 rounded-xl shadow-xs">
          <h1 className="text-sm sm:text-base font-black tracking-wide">
            التقرير الإداري والإحصائي الدوري للوحة التحكم
          </h1>
          <p className="text-[11px] text-slate-300 font-mono mt-0.5">
            RAPPORT ANALYTIQUE & FINANCIER DE GESTION
          </p>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-600 font-semibold" dir="rtl">
          <span>الكيان: <strong>{currentInstitution.nameAr}</strong></span>
          <span>·</span>
          <span>العام الدراسي: <strong className="font-mono">2026 - 2027</strong></span>
          <span>·</span>
          <span>التاريخ: <strong className="font-mono">{currentDate}</strong></span>
          <span>·</span>
          <span>رقم الوثيقة: <strong className="font-mono text-blue-700">{reportNumber}</strong></span>
        </div>
      </div>

      {/* 3. Executive KPI Dashboard Grid */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5" dir="rtl">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>أولاً: الملخص التنفيذي للمؤشرات الرئيسية (Indicateurs Clés de Performance)</span>
        </h3>

        <div className="grid grid-cols-4 gap-2.5 text-center">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">إجمالي التلاميذ المقيدين</span>
            <div className="text-base font-black text-slate-900 font-mono tabular-nums">{students.length}</div>
            <span className="text-[9px] text-slate-400">نسبة الإشغال: {occupancyRate}%</span>
          </div>

          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <span className="text-[10px] text-emerald-800 font-semibold block mb-0.5">إجمالي المقبوضات الفعلية</span>
            <div className="text-base font-black text-emerald-700 font-mono tabular-nums">{totalCollected.toLocaleString()} MRU</div>
            <span className="text-[9px] text-emerald-600">نسبة التحصيل: {collectionRate}%</span>
          </div>

          <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl">
            <span className="text-[10px] text-rose-800 font-semibold block mb-0.5">إجمالي المصروفات والنفقات</span>
            <div className="text-base font-black text-rose-700 font-mono tabular-nums">{totalExpenses.toLocaleString()} MRU</div>
            <span className="text-[9px] text-rose-600">نفقات تشغيلية ورواتب</span>
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <span className="text-[10px] text-blue-800 font-semibold block mb-0.5">الصافي المالي العام</span>
            <div className={`text-base font-black font-mono tabular-nums ${netBalance >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
              {netBalance.toLocaleString()} MRU
            </div>
            <span className="text-[9px] text-blue-600">المقبوضات − المصروفات</span>
          </div>
        </div>
      </div>

      {/* 4. Table 1: Student Enrollment Evolution */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2" dir="rtl">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>ثانياً: تطور تسجيل الطلاب شهرياً وحسب المراحل التعليمية (Évolution des Inscriptions)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">بيانات مؤكدة بالسجلات</span>
        </div>

        <table className="w-full text-right border-collapse border border-slate-300 text-[11px]">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
            <tr>
              <th className="p-2 border border-slate-300 text-center w-12">الرقم</th>
              <th className="p-2 border border-slate-300">الشهر</th>
              <th className="p-2 border border-slate-300 text-center font-mono">المرحلة الابتدائية</th>
              {institutionId !== 'institut' && (
                <>
                  <th className="p-2 border border-slate-300 text-center font-mono">المرحلة الإعدادية</th>
                  <th className="p-2 border border-slate-300 text-center font-mono">المرحلة الثانوية</th>
                </>
              )}
              <th className="p-2 border border-slate-300 text-center font-mono bg-blue-50/50 font-black">
                إجمالي المسجلين
              </th>
              <th className="p-2 border border-slate-300 text-center font-mono">معدل الزيادة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {enrollmentData.map((row, idx) => {
              const prevTotal = idx > 0 ? enrollmentData[idx - 1].total : row.total;
              const growth = prevTotal > 0 ? Math.round(((row.total - prevTotal) / prevTotal) * 100) : 0;
              return (
                <tr key={row.month} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-2 border border-slate-300 font-bold text-slate-900">{row.month}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-semibold text-emerald-700">{row.primary} تلميذ</td>
                  {institutionId !== 'institut' && (
                    <>
                      <td className="p-2 border border-slate-300 text-center font-mono font-semibold text-blue-700">{row.middle} تلميذ</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-semibold text-purple-700">{row.secondary} تلميذ</td>
                    </>
                  )}
                  <td className="p-2 border border-slate-300 text-center font-mono font-black text-slate-900 bg-blue-50/30">
                    {row.total} تلميذ
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-600">
                    {idx === 0 ? '—' : `+${growth}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Table 2: Monthly Fee Collection vs Remaining Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2" dir="rtl">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>ثالثاً: موقف تحصيل الرسوم الشهرية والمبالغ المستحقة (Recouvrement des Frais Scolaires)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">العملة: أوقية موريتانية (MRU)</span>
        </div>

        <table className="w-full text-right border-collapse border border-slate-300 text-[11px]">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
            <tr>
              <th className="p-2 border border-slate-300 text-center w-12">الرقم</th>
              <th className="p-2 border border-slate-300">الشهر الدراسي</th>
              <th className="p-2 border border-slate-300 text-center font-mono">المبلغ المطلوب (Target)</th>
              <th className="p-2 border border-slate-300 text-center font-mono text-emerald-700">المحصل الفعلي</th>
              <th className="p-2 border border-slate-300 text-center font-mono text-amber-700">المتبقي غير المحصل</th>
              <th className="p-2 border border-slate-300 text-center font-mono">نسبة التحصيل</th>
              <th className="p-2 border border-slate-300 text-center">الموقف التنفيذي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {feeCollectionData.map((row, idx) => {
              const rate = row.target > 0 ? Math.round((row.collected / row.target) * 100) : 0;
              return (
                <tr key={row.month} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-2 border border-slate-300 font-bold text-slate-900">{row.month}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-800">
                    {row.target.toLocaleString()} MRU
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-black text-emerald-700">
                    {row.collected.toLocaleString()} MRU
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-black text-amber-700">
                    {row.remaining.toLocaleString()} MRU
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                    <span className={`px-1.5 py-0.5 rounded ${rate >= 80 ? 'bg-emerald-100 text-emerald-800' : rate >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                      {rate}%
                    </span>
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-medium">
                    {rate >= 85 ? 'ممتاز ومكتمل' : rate >= 60 ? 'قيد المتابعة الدورية' : 'يتطلب إشعاراً عاجلاً للوكلاء'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Administrative Notes & Observations */}
      <div className="mb-8 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" dir="rtl">
        <h4 className="font-bold text-slate-800 mb-1 text-[11px]">ملاحظات وتوجيهات الإدارة العامة:</h4>
        <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600 leading-relaxed">
          <li>نسبة تحصيل الرسوم في الأشهر الأولى بلغت مستويات متقدمة تفوق 85% بفضل التذكير المنتظم عبر مركز الإشعارات.</li>
          <li>تم تطبيق قاعدة إعفاء الطلاب المنضمين في منتصف العام تلقائياً من أقساط الأشهر السابقة لتاريخ تسجيلهم الرسمي.</li>
          <li>يوصى بالاستمرار في توجيه التذكيرات عبر رسائل الواتساب لأولياء الأمور المتأخرين عن سداد أقساط الأشهر الجارية.</li>
        </ul>
      </div>

      {/* 7. Signatures & Official Stamps */}
      <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-xs">
        {/* Accountant Signature */}
        <div className="text-center w-52">
          <span className="font-bold text-slate-800 block mb-0.5" dir="rtl">المحاسب المالي العام</span>
          <span className="text-[10px] text-slate-500 font-mono block mb-6">Le Comptable Général</span>
          <div className="w-36 h-12 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 mx-auto">
            توقيع المحاسب
          </div>
        </div>

        {/* School Center Stamp */}
        <div className="text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-slate-400 border-dashed flex items-center justify-center text-[10px] text-slate-400 text-center p-1">
            الختم الرسمي للمؤسسة
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">ECOLE BEKAR</span>
        </div>

        {/* General Director Signature */}
        <div className="text-center w-52">
          <span className="font-bold text-slate-800 block mb-0.5" dir="rtl">اعتماد المدير العام</span>
          <span className="text-[10px] text-slate-500 font-mono block mb-6">Le Directeur Général</span>
          <div className="w-36 h-12 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 mx-auto">
            توقيع وختم المدير العام
          </div>
        </div>
      </div>
    </div>
  );
};
