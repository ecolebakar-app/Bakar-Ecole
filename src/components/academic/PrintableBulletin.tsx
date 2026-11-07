/**
 * Official Primary School Bulletin Component (كشف الدرجات / Bulletin de Notes)
 * Sized strictly for A5 Portrait (148mm x 210mm)
 * Exact replica of the Mauritanian Primary School Scan:
 * Reference: /public/assets/aistudio/__________2026-11-04_172828_2cbdf7f2.png
 * Complexe des écoles privées BAKAR / مجمع مدارس بكّار الحرة
 * Features:
 * - Ultra-compact scaling to fit screen without scrolling
 * - Precise colons without reversed or duplicate punctuation
 * - Scaled down academic year and title typography
 * - Clean dual Arabic/French compositions table
 */

import React from 'react';
import { Student } from '../../types';
import { StorageEngine } from '../../services/storage';

interface SubjectRowProps {
  nameAr: string;
  nameFr: string;
  maxScore: number;
  c1?: number | null;
  c2?: number | null;
  c3?: number | null;
  avg?: number | null;
}

interface PrintableBulletinProps {
  student: Student;
  term?: 'term_1' | 'term_2' | 'term_3';
  academicYear?: string;
  customData?: {
    c1Scores?: Record<string, number>;
    c2Scores?: Record<string, number>;
    c3Scores?: Record<string, number>;
    absences?: number;
    rank?: number;
    totalStudents?: number;
    decisionText?: string;
  };
}

export const PrintableBulletin: React.FC<PrintableBulletinProps> = ({
  student,
  term = 'term_1',
  academicYear = '2026 - 2027',
  customData
}) => {
  const classes = StorageEngine.getClasses(student.institutionId);
  const studentClass = classes.find(c => c.id === student.classId);
  const grades = StorageEngine.getGrades(student.institutionId);
  const studentGrade = grades.find(g => g.id === student.gradeId);

  // Grade order (1 to 6)
  const gradeOrder = studentGrade?.order || 1;

  // Adaptable primary subjects
  const hasHistoryGeo = gradeOrder >= 3;
  const hasCivics = gradeOrder >= 3;

  // Realistic sample/custom scores
  const defaultScores = customData?.c1Scores || {
    ar: 42,
    islamic: 18,
    histGeo: hasHistoryGeo ? 16 : 0,
    civics: hasCivics ? 9 : 0,
    math: 45,
    science: 17,
    fr: 24
  };

  const c2Scores = customData?.c2Scores || {
    ar: 44,
    islamic: 19,
    histGeo: hasHistoryGeo ? 17 : 0,
    civics: hasCivics ? 9 : 0,
    math: 47,
    science: 18,
    fr: 26
  };

  const c3Scores = customData?.c3Scores || {
    ar: 45,
    islamic: 19,
    histGeo: hasHistoryGeo ? 18 : 0,
    civics: hasCivics ? 10 : 0,
    math: 48,
    science: 19,
    fr: 25
  };

  // Arabic subjects list (7 rows matching the primary scan)
  const arabicRows: SubjectRowProps[] = [
    {
      nameAr: 'اللغة العربية',
      nameFr: 'Arabe',
      maxScore: 50,
      c1: defaultScores.ar,
      c2: term !== 'term_1' ? c2Scores.ar : null,
      c3: term === 'term_3' ? c3Scores.ar : null
    },
    {
      nameAr: 'التربية الإسلامية',
      nameFr: 'Éduc Islamique',
      maxScore: 20,
      c1: defaultScores.islamic,
      c2: term !== 'term_1' ? c2Scores.islamic : null,
      c3: term === 'term_3' ? c3Scores.islamic : null
    },
    {
      nameAr: hasHistoryGeo ? 'التاريخ والجغرافيا' : '/',
      nameFr: hasHistoryGeo ? 'Histoire-Géo' : '/',
      maxScore: hasHistoryGeo ? 20 : 0,
      c1: hasHistoryGeo ? defaultScores.histGeo : null,
      c2: hasHistoryGeo && term !== 'term_1' ? c2Scores.histGeo : null,
      c3: hasHistoryGeo && term === 'term_3' ? c3Scores.histGeo : null
    },
    {
      nameAr: hasCivics ? 'التربية المدنية' : '/',
      nameFr: hasCivics ? 'Éduc Civique' : '/',
      maxScore: hasCivics ? 10 : 0,
      c1: hasCivics ? defaultScores.civics : null,
      c2: hasCivics && term !== 'term_1' ? c2Scores.civics : null,
      c3: hasCivics && term === 'term_3' ? c3Scores.civics : null
    },
    {
      nameAr: 'الرياضيات',
      nameFr: 'Mathématiques',
      maxScore: 50,
      c1: defaultScores.math,
      c2: term !== 'term_1' ? c2Scores.math : null,
      c3: term === 'term_3' ? c3Scores.math : null
    },
    {
      nameAr: 'العلوم',
      nameFr: 'Sciences',
      maxScore: 20,
      c1: defaultScores.science,
      c2: term !== 'term_1' ? c2Scores.science : null,
      c3: term === 'term_3' ? c3Scores.science : null
    },
    {
      nameAr: '/',
      nameFr: '/',
      maxScore: 0,
      c1: null,
      c2: null,
      c3: null
    }
  ];

  // French subjects (Row 1 is Français / 30, rows 2 to 7 are /)
  const frenchRows: SubjectRowProps[] = [
    {
      nameAr: 'الفرنسية',
      nameFr: 'Français',
      maxScore: 30,
      c1: defaultScores.fr,
      c2: term !== 'term_1' ? c2Scores.fr : null,
      c3: term === 'term_3' ? c3Scores.fr : null
    },
    { nameAr: '/', nameFr: '/', maxScore: 0, c1: null, c2: null, c3: null },
    { nameAr: '/', nameFr: '/', maxScore: 0, c1: null, c2: null, c3: null },
    { nameAr: '/', nameFr: '/', maxScore: 0, c1: null, c2: null, c3: null },
    { nameAr: '/', nameFr: '/', maxScore: 0, c1: null, c2: null, c3: null },
    { nameAr: '/', nameFr: '/', maxScore: 0, c1: null, c2: null, c3: null },
    { nameAr: '/', nameFr: '/', maxScore: 0, c1: null, c2: null, c3: null }
  ];

  const computeAvg = (row: SubjectRowProps): number => {
    if (row.maxScore === 0) return 0;
    const scores = [row.c1, row.c2, row.c3].filter((s): s is number => s !== null && s !== undefined);
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Number((sum / scores.length).toFixed(1));
  };

  // Calculations
  const totalArabicEarned = arabicRows.reduce((sum, r) => sum + computeAvg(r), 0);
  const totalArabicMax = arabicRows.reduce((sum, r) => sum + r.maxScore, 0);
  const totalFrenchEarned = frenchRows.reduce((sum, r) => sum + computeAvg(r), 0);
  const totalFrenchMax = frenchRows.reduce((sum, r) => sum + r.maxScore, 0);

  const grandTotalEarned = totalArabicEarned + totalFrenchEarned;
  const grandTotalMax = totalArabicMax + totalFrenchMax;
  const generalAverage = grandTotalMax > 0 ? Number(((grandTotalEarned / grandTotalMax) * 10).toFixed(2)) : 0;

  const rank = customData?.rank || 4;
  const totalStudents = customData?.totalStudents || 35;
  const absences = customData?.absences || 0;
  const decisionText = customData?.decisionText || (generalAverage >= 5 ? 'ينتقل إلى القسم الموالي' : 'يكرر السنة');

  return (
    <div
      dir="ltr"
      className="bg-white text-black p-2.5 sm:p-3.5 font-sans max-w-[148mm] mx-auto text-[9.5px] print:p-0 print:m-0 print:max-w-none select-none border border-slate-300 rounded-xl shadow-xs"
    >
      {/* 1. Official School Header Banner */}
      <div className="w-full mb-1">
        <img
          src="/assets/aistudio/__________2026-10-22_161815_d10b3316.png"
          alt="ترويسة مجمع مدارس بكار الحرة"
          className="w-full object-contain max-h-16 sm:max-h-18"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* 2. Scaled Down Title */}
      <div className="text-center my-1">
        <h1 className="text-xs sm:text-sm font-black tracking-wide text-black">
          كشف الدرجات
        </h1>
        <h2 className="text-[10px] sm:text-xs font-black tracking-wide text-black">
          Bulletin de Notes
        </h2>
        <span className="text-[9px] font-bold font-mono text-slate-800 block mt-0.5">
          {academicYear}
        </span>
      </div>

      {/* 3. Student Metadata (Exact clean colons and proper alignment) */}
      <div className="grid grid-cols-2 gap-2 text-[9px] mb-1.5 px-1 text-black border-y border-slate-200 py-1">
        {/* Left Column (French) */}
        <div className="space-y-0.5 text-left">
          <div className="flex items-center">
            <span className="w-18 text-slate-700 font-semibold">Nom :</span>
            <span className="font-bold font-mono">{student.firstNameFr} {student.lastNameFr}</span>
          </div>
          <div className="flex items-center">
            <span className="w-18 text-slate-700 font-semibold">Classe :</span>
            <span className="font-bold">{studentClass?.nameFr || studentGrade?.code || studentGrade?.nameAr || '1AS'}</span>
          </div>
          <div className="flex items-center">
            <span className="w-18 text-slate-700 font-semibold">Trimestre :</span>
            <span className="font-bold">{term === 'term_1' ? '1er' : term === 'term_2' ? '2ème' : '3ème'}</span>
          </div>
          <div className="flex items-center">
            <span className="w-18 text-slate-700 font-semibold">NNI :</span>
            <span className="font-bold font-mono">{student.nationalId || '—'}</span>
          </div>
        </div>

        {/* Right Column (Arabic) */}
        <div className="space-y-0.5 text-right" dir="rtl">
          <div className="flex items-center">
            <span className="w-24 text-slate-700 font-bold">الاسم :</span>
            <span className="font-bold">{student.firstNameAr} {student.lastNameAr}</span>
          </div>
          <div className="flex items-center">
            <span className="w-24 text-slate-700 font-bold">القسم :</span>
            <span className="font-bold">{studentGrade?.nameAr} {studentClass ? `(${studentClass.nameAr})` : ''}</span>
          </div>
          <div className="flex items-center">
            <span className="w-24 text-slate-700 font-bold">الفصل :</span>
            <span className="font-bold">{term === 'term_1' ? 'الأول' : term === 'term_2' ? 'الثاني' : 'الثالث'}</span>
          </div>
          <div className="flex items-center">
            <span className="w-24 text-slate-700 font-bold">الرقم الوطني :</span>
            <span className="font-bold font-mono">{student.nationalId || '—'}</span>
          </div>
        </div>
      </div>

      {/* 4. Dual Arabic / French Compositions Table */}
      <div className="overflow-x-auto mb-1.5">
        <table className="w-full text-center border-collapse border border-black text-[9px] leading-tight">
          <thead>
            <tr className="border-b border-black divide-x divide-black bg-slate-50 font-semibold text-black">
              {/* French side headers */}
              <th className="p-0.5 border-r border-black w-[16%]">
                <div className="font-bold">مواد الفرنسية</div>
                <div className="text-[7.5px] font-normal">Matières de français</div>
              </th>
              <th className="p-0.5 border-r border-black w-[8%] font-bold text-[8px]">1er<br/>COMPO</th>
              <th className="p-0.5 border-r border-black w-[8%] font-bold text-[8px]">2em<br/>COMPO</th>
              <th className="p-0.5 border-r border-black w-[8%] font-bold text-[8px]">3em<br/>COMPO</th>
              <th className="p-0.5 border-r border-black w-[10%]">
                <div className="font-bold text-[8.5px]">Moyenne</div>
                <div className="text-[7.5px]">Français</div>
              </th>

              {/* Arabic side headers */}
              <th className="p-0.5 border-r border-black w-[10%]">
                <div className="font-bold text-[8.5px]">معدل</div>
                <div className="text-[7.5px]">العربية</div>
              </th>
              <th className="p-0.5 border-r border-black w-[8%] font-bold text-[8px]">الامتحان<br/>الثالث</th>
              <th className="p-0.5 border-r border-black w-[8%] font-bold text-[8px]">الامتحان<br/>الثاني</th>
              <th className="p-0.5 border-r border-black w-[8%] font-bold text-[8px]">الامتحان<br/>الأول</th>
              <th className="p-0.5 w-[16%]">
                <div className="font-bold">مواد العربية</div>
                <div className="text-[7.5px] font-normal">Matières d'Arabe</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {arabicRows.map((arRow, idx) => {
              const frRow = frenchRows[idx];
              const arAvg = computeAvg(arRow);
              const frAvg = frRow ? computeAvg(frRow) : 0;

              return (
                <tr key={idx} className="divide-x divide-black h-5 text-black">
                  {/* French Side */}
                  <td className="p-0.5 border-r border-black text-center font-normal">
                    {frRow ? frRow.nameFr : '/'}
                  </td>
                  <td className="p-0.5 border-r border-black font-mono">
                    {frRow && frRow.maxScore > 0 ? (frRow.c1 !== null ? `${frRow.c1}/${frRow.maxScore}` : `0/${frRow.maxScore}`) : '/'}
                  </td>
                  <td className="p-0.5 border-r border-black font-mono">
                    {frRow && frRow.maxScore > 0 ? (frRow.c2 !== null ? `${frRow.c2}/${frRow.maxScore}` : `0/${frRow.maxScore}`) : '/'}
                  </td>
                  <td className="p-0.5 border-r border-black font-mono">
                    {frRow && frRow.maxScore > 0 ? (frRow.c3 !== null ? `${frRow.c3}/${frRow.maxScore}` : `0/${frRow.maxScore}`) : '/'}
                  </td>
                  <td className="p-0.5 border-r border-black font-mono font-bold bg-slate-50/60">
                    {frRow && frRow.maxScore > 0 ? frAvg : '/'}
                  </td>

                  {/* Arabic Side */}
                  <td className="p-0.5 border-r border-black font-mono font-bold bg-slate-50/60">
                    {arRow.maxScore > 0 ? arAvg : '/'}
                  </td>
                  <td className="p-0.5 border-r border-black font-mono">
                    {arRow.maxScore > 0 ? (arRow.c3 !== null ? `${arRow.c3}/${arRow.maxScore}` : `0/${arRow.maxScore}`) : '/'}
                  </td>
                  <td className="p-0.5 border-r border-black font-mono">
                    {arRow.maxScore > 0 ? (arRow.c2 !== null ? `${arRow.c2}/${arRow.maxScore}` : `0/${arRow.maxScore}`) : '/'}
                  </td>
                  <td className="p-0.5 border-r border-black font-mono">
                    {arRow.maxScore > 0 ? (arRow.c1 !== null ? `${arRow.c1}/${arRow.maxScore}` : `0/${arRow.maxScore}`) : '/'}
                  </td>
                  <td className="p-0.5 text-center font-bold" dir="rtl">
                    {arRow.nameAr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Summary / Totals Boxes */}
      <div className="grid grid-cols-2 gap-2 mb-1.5 text-[8.5px]">
        {/* French Totals */}
        <div className="border border-black p-1 space-y-0.5">
          <div className="flex justify-between">
            <span>Total français :</span>
            <span className="font-mono font-bold">{totalFrenchEarned} / {totalFrenchMax}</span>
          </div>
        </div>

        {/* Arabic Totals */}
        <div className="border border-black p-1 space-y-0.5" dir="rtl">
          <div className="flex justify-between">
            <span>مجموع العربية :</span>
            <span className="font-mono font-bold">{totalArabicEarned} / {totalArabicMax}</span>
          </div>
        </div>
      </div>

      {/* 6. Grand Average & Class Statistics */}
      <div className="border-2 border-black p-1.5 rounded-lg mb-1.5 bg-slate-50/50 text-[9px]">
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-300">
          <div>
            <span className="block text-[8px] text-slate-600">المعدل العام (Sur 10)</span>
            <span className="text-xs font-black font-mono text-emerald-900">{generalAverage} / 10</span>
          </div>
          <div>
            <span className="block text-[8px] text-slate-600">الرتبة / Rang</span>
            <span className="text-xs font-black font-mono text-slate-900">{rank} / {totalStudents}</span>
          </div>
          <div>
            <span className="block text-[8px] text-slate-600">الغياب / Absences</span>
            <span className="text-xs font-black font-mono text-slate-900">{absences} أيام</span>
          </div>
        </div>
      </div>

      {/* 7. Council Decision & Signatures */}
      <div className="border border-black p-1.5 rounded-lg text-[8.5px] space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold">Décision du conseil : </span>
            <span className="font-semibold text-slate-800">{generalAverage >= 5 ? 'Passe en classe supérieure' : 'Redouble'}</span>
          </div>
          <div dir="rtl">
            <span className="font-bold">قرار مجلس القسم : </span>
            <span className="font-bold text-slate-900">{decisionText}</span>
          </div>
        </div>

        <div className="pt-2 grid grid-cols-3 text-center text-[8px] font-bold">
          <div>
            <span>توقيع المعلم</span>
            <div className="w-16 border-b border-black mx-auto mt-4" />
          </div>
          <div>
            <span>تأشيرة الولي</span>
            <div className="w-16 border-b border-black mx-auto mt-4" />
          </div>
          <div>
            <span>المدير والختم</span>
            <div className="w-16 border-b border-black mx-auto mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
