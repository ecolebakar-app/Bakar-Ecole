/**
 * Official Printable Payment Receipt Component
 * Exact 1:1 Replica of the official receipt scan provided in the PDF:
 * Reference: PDF Page 1 (Reçu de paiement et quittance)
 * Complexe des écoles privées BAKAR / مجمع مدارس بكّار الحرة
 * Features:
 * - Green dashed outer boundary with rounded-3xl corners
 * - Left vertical stripe with rotated text (Frais mensuels / الرسوم الشهرية / Le / شهر)
 * - Three-part official header with center logo and green underline
 * - Left financial block with vibrant green pill and exact fields
 * - Right student/guardian info block with dotted leader lines
 * - Exact disclaimer and accountant signature
 */

import React from 'react';
import { PaymentReceipt } from '../../types';
import { StorageEngine } from '../../services/storage';

interface PrintableReceiptProps {
  receipt: PaymentReceipt;
  monthName?: string;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ receipt, monthName }) => {
  const student = StorageEngine.getStudentById(receipt.studentId);
  const guardian = student ? StorageEngine.getGuardians().find(g => g.id === student.guardianId) : null;
  const classes = StorageEngine.getClasses(receipt.institutionId);
  const studentClass = student ? classes.find(c => c.id === student.classId) : null;
  const grades = StorageEngine.getGrades(receipt.institutionId);
  const studentGrade = student ? grades.find(g => g.id === student.gradeId) : null;

  // Calculate total due & remaining for this student's invoices
  const studentInvoices = StorageEngine.getInvoices(receipt.institutionId, receipt.studentId);
  const totalDue = studentInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
  const totalRemaining = studentInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  const studentNameAr = student ? `${student.firstNameAr} ${student.lastNameAr}` : '—';
  const studentNameFr = student ? `${student.firstNameFr} ${student.lastNameFr}` : '—';
  const guardianName = guardian ? (guardian.nameAr || guardian.nameFr) : (student ? `${student.lastNameAr}` : '—');
  const guardianPhone = guardian?.phone1 || student?.phone || '—';
  const classDisplayName = studentClass
    ? `${studentGrade?.nameAr || ''} - ${studentClass.nameAr || studentClass.nameFr}`
    : (studentGrade?.nameAr || '—');
  const classDisplayFr = studentClass?.nameFr || studentGrade?.code || '1AS';

  const todayStr = new Date().toISOString().split('T')[0];
  const dueDisplay = totalDue > 0 ? `${totalDue.toLocaleString()} MRU` : `${receipt.amountPaid.toLocaleString()} MRU`;
  const restDisplay = `${totalRemaining.toLocaleString()} MRU`;
  const paidDisplay = `${receipt.amountPaid.toLocaleString()} MRU`;
  const displayMonth = monthName || (receipt.notes ? receipt.notes : 'أكتوبر 2026');

  // Enforce REC-B prefix
  const formattedReceiptNo = receipt.receiptNumber.replace(/^REC-E/, 'REC-B').replace(/^REC-I/, 'REC-B');

  return (
    <div
      dir="ltr"
      className="bg-white text-black p-3 sm:p-4 font-sans border-2 border-dashed border-[#86d267] rounded-3xl max-w-[155mm] mx-auto text-[10px] print:border-2 print:border-dashed print:border-[#86d267] print:p-3 print:m-0 print:max-w-none shadow-sm select-none relative overflow-hidden"
    >
      <div className="flex">
        {/* Far Left Vertical Rotated Band (Exact Replica of Scan) */}
        <div className="w-8 shrink-0 flex flex-col items-center justify-between border-r border-[#86d267]/60 pr-1.5 mr-2 select-none text-[8.5px] font-bold text-slate-800">
          <div className="-rotate-90 whitespace-nowrap origin-center tracking-wider flex items-center gap-1.5 mt-8">
            <span className="text-emerald-800 font-extrabold">{displayMonth}</span>
            <span>:شهر</span>
            <span className="text-slate-400">|</span>
            <span>الرسوم الشهرية</span>
          </div>

          <div className="-rotate-90 whitespace-nowrap origin-center tracking-wider flex items-center gap-1.5 mb-8">
            <span className="font-mono text-slate-700">{receipt.paymentDate}</span>
            <span>:Le</span>
            <span className="text-slate-400">|</span>
            <span>Frais mensuels</span>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 space-y-2">
          {/* 1. Header (Three-section: French on left, round logo in center, Arabic on right) */}
          <div className="flex items-center justify-between pb-1.5 border-b-2 border-[#86d267]">
            {/* Left: French Institution Text */}
            <div className="text-left leading-tight">
              <h2 className="text-[10px] font-black text-emerald-850 tracking-tight">
                Complexe des écoles privées BAKAR
              </h2>
              <p className="text-[8.5px] text-slate-700 font-medium">
                Honnêteté – Persévérance – Réussite
              </p>
              <p className="text-[8px] font-bold text-slate-900 font-mono mt-0.5">
                Arrêtée conjoint N° 231
              </p>
            </div>

            {/* Center: School Logo with green wreath */}
            <div className="w-12 h-12 flex items-center justify-center shrink-0 mx-2">
              <img
                src="/assets/aistudio/logo_fe103f4c.png"
                alt="شعار مجمع مدارس بكار الحرة"
                className="w-11 h-11 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Right: Arabic Institution Text */}
            <div className="text-right leading-tight" dir="rtl">
              <h2 className="text-[10.5px] font-black text-emerald-950 tracking-tight">
                مجمــــع مــــــــــــــــــدارسبكــــــــــــــــار الحــــــــــــــــــــــــرة
              </h2>
              <p className="text-[9px] text-slate-700 font-bold">
                أمانــــــــــــــــــــة – مثابـــــــــــــــرة – نجـــــــــــــاح
              </p>
              <p className="text-[8.5px] font-bold text-slate-900 font-mono mt-0.5">
                مقرر مشترك : رقم 231
              </p>
            </div>
          </div>

          {/* 2. Content Row: Left Financial Block & Right Student/Guardian Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-0.5">
            {/* Left Financial Card (5 columns) */}
            <div className="sm:col-span-5 space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-emerald-50/20">
              {/* Vibrant Green Rounded Header Pill */}
              <div className="bg-[#86d267] text-slate-950 font-black text-[9.5px] px-2 py-1 rounded-xl text-center shadow-2xs leading-tight">
                <div>وصل دفع ومخالصة</div>
                <div className="text-[8.5px] font-bold text-slate-900">Reçu de paiement et quittance</div>
              </div>

              {/* Financial Fields */}
              <div className="space-y-1 text-[9px] font-bold text-slate-900 pt-0.5">
                {/* Reçu n° */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Reçu n°</span>
                  <span className="font-mono font-black text-[10px] text-emerald-900">{formattedReceiptNo}</span>
                  <span className="text-slate-800">رقم الوصل</span>
                </div>

                {/* Date de paiement */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Date de paiement</span>
                  <span className="font-mono text-slate-900 font-bold">{receipt.paymentDate}</span>
                  <span className="text-slate-800">تاريخ التسديد:</span>
                </div>

                {/* Montant dû */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Montant dû:</span>
                  <span className="font-mono font-bold text-slate-900">{dueDisplay}</span>
                  <span className="text-slate-800">المبلغ المستحق:</span>
                </div>

                {/* Montant payé */}
                <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-0.5 bg-emerald-100/40 px-1 rounded-md">
                  <span className="text-emerald-900 font-black">Montant payé:</span>
                  <span className="font-mono font-black text-[10.5px] text-emerald-950">{paidDisplay}</span>
                  <span className="text-emerald-950 font-black">المبلغ المدفوع:</span>
                </div>

                {/* Rest à payer */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600">Rest à payer:</span>
                  <span className="font-mono font-bold text-rose-700">{restDisplay}</span>
                  <span className="text-slate-800">المتبقي:</span>
                </div>
              </div>
            </div>

            {/* Right Student & Guardian Data with Dotted Lines (7 columns) */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-1.5 text-[9px] font-bold">
              {/* Row 1: Nom / الاسم */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 shrink-0">Nom</span>
                <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 text-center font-bold text-slate-950 truncate">
                  {studentNameFr} / {studentNameAr}
                </span>
                <span className="text-slate-800 shrink-0">الاسم</span>
              </div>

              {/* Row 2: Class / القسم */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 shrink-0">Class</span>
                <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 text-center font-bold text-slate-950 truncate">
                  {classDisplayName} ({classDisplayFr})
                </span>
                <span className="text-slate-800 shrink-0">القسم</span>
              </div>

              {/* Row 3: Numerous / رقم النداء */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 shrink-0">Numerous</span>
                <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 text-center font-mono font-black text-emerald-900">
                  {student?.registrationNumber || student?.nationalId || '—'}
                </span>
                <span className="text-slate-800 shrink-0">رقم النداء</span>
              </div>

              {/* Row 4: Nom du parent/tuteur / اسم ولي الأمر */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 shrink-0">Nom du parent/tuteur</span>
                <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 text-center font-bold text-slate-950 truncate">
                  {guardianName}
                </span>
                <span className="text-slate-800 shrink-0">اسم ولي الأمر</span>
              </div>

              {/* Row 5: Numéro de téléphone du tuteur / رقم هاتف ولي الأمر */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 shrink-0">Numéro de téléphone du tuteur</span>
                <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 text-center font-mono font-bold text-slate-900" dir="ltr">
                  {guardianPhone}
                </span>
                <span className="text-slate-800 shrink-0">رقم هاتف ولي الأمر</span>
              </div>

              {/* Row 6: Date D'iimpression / تاريخ السحب */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 shrink-0">Date D'iimpression</span>
                <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 text-center font-mono font-bold text-slate-900">
                  {todayStr}
                </span>
                <span className="text-slate-800 shrink-0">تاريخ السحب</span>
              </div>
            </div>
          </div>

          {/* 3. Bottom Legal Disclaimer (Exact Text from Scan) */}
          <div className="pt-1 text-[7.5px] sm:text-[8px] text-slate-700 leading-tight border-t border-slate-200 text-center space-y-0.5">
            <div dir="rtl" className="font-semibold text-slate-900">
              ملاحظة: يجب على الوكيل استلام وحفظ هذا الوصل الذي يعتبر الإثبات الوحيد لدفع المستحقات.
            </div>
            <div className="text-slate-600">
              Remarque : L'agent doit réceptionner et conserver ce reçu, qui constitue la seule preuve du paiement des sommes dues.
            </div>
          </div>

          {/* 4. Accountant Signature Section */}
          <div className="pt-1 flex flex-col items-center justify-center text-[9px] font-bold text-slate-900">
            <span>المحاسب</span>
            <span className="text-[8.5px] font-semibold text-slate-600">Le comptable</span>
            <div className="w-24 border-b border-slate-300 mt-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
