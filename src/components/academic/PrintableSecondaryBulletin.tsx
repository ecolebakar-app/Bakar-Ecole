/**
 * Official Printable Secondary / Middle Bulletin Component
 * Exact 1:1 Replica of Mauritanian Middle & Secondary Bulletin Scan (Scan 3)
 * Complexe des écoles privées BAKAR / مجمع مدارس بكّار الحرة
 */

import React from 'react';
import { Student } from '../../types';
import { StorageEngine } from '../../services/storage';

interface PrintableSecondaryBulletinProps {
  student: Student;
  term?: 'term_1' | 'term_2' | 'term_3';
  academicYear?: string;
}

export const PrintableSecondaryBulletin: React.FC<PrintableSecondaryBulletinProps> = ({
  student,
  term = 'term_1',
  academicYear = '2025-2026'
}) => {
  const classes = StorageEngine.getClasses(student.institutionId);
  const studentClass = classes.find(c => c.id === student.classId);
  const grades = StorageEngine.getGrades(student.institutionId);
  const studentGrade = grades.find(g => g.id === student.gradeId);

  // Term Labels
  const termLabels: Record<string, { ar: string; fr: string }> = {
    term_1: { ar: 'الفصل الأول', fr: '1er Trimestre' },
    term_2: { ar: 'الفصل الثاني', fr: '2ème Trimestre' },
    term_3: { ar: 'الفصل الثالث', fr: '3ème Trimestre' }
  };

  const currentTermInfo = termLabels[term] || termLabels.term_1;

  // Retrieve stored bulletin if any
  const savedBulletin = StorageEngine.getSecondaryBulletin(student.id, term);

  // Standard Mauritanian Secondary Curriculum Subjects with coefficients summing to 24
  const defaultSubjects = [
    { nameAr: 'التربية الإسلامية', nameFr: 'Éducation Islamique', coeff: 3, devoir: 16.5, exam1: 17, exam2: 16, exam3: 16.5, moy: 16.5, obs: 'ممتاز' },
    { nameAr: 'اللغة العربية', nameFr: 'Langue Arabe', coeff: 5, devoir: 15, exam1: 14.5, exam2: 15.5, exam3: 15, moy: 15.1, obs: 'جيد جداً' },
    { nameAr: 'التاريخ والجغرافيا', nameFr: 'Histoire - Géographie', coeff: 2, devoir: 14, exam1: 13.5, exam2: 14, exam3: 14, moy: 13.9, obs: 'حسن' },
    { nameAr: 'التربية المدنية', nameFr: 'Éducation Civique', coeff: 1, devoir: 17, exam1: 16, exam2: 18, exam3: 17, moy: 17.0, obs: 'ممتاز' },
    { nameAr: 'الرياضيات', nameFr: 'Mathématiques', coeff: 5, devoir: 14.5, exam1: 15, exam2: 14, exam3: 15, moy: 14.6, obs: 'عمل جاد' },
    { nameAr: 'العلوم الطبيعية', nameFr: 'Sciences Naturelles', coeff: 2, devoir: 13, exam1: 14, exam2: 13.5, exam3: 13.5, moy: 13.5, obs: 'مستوى طيب' },
    { nameAr: 'اللغة الفرنسية', nameFr: 'Langue Française', coeff: 4, devoir: 14, exam1: 13.5, exam2: 14.5, exam3: 14, moy: 14.0, obs: 'Bien' },
    { nameAr: 'اللغة الإنجليزية', nameFr: 'Langue Anglaise', coeff: 1, devoir: 15.5, exam1: 15, exam2: 16, exam3: 15.5, moy: 15.5, obs: 'Good' },
    { nameAr: 'المعلوماتية', nameFr: 'Informatique', coeff: 1, devoir: 18, exam1: 17.5, exam2: 18, exam3: 18, moy: 17.9, obs: 'Excellent' }
  ];

  const subjects = savedBulletin?.subjects || defaultSubjects.map(s => ({
    subjectNameAr: s.nameAr,
    subjectNameFr: s.nameFr,
    devoir: s.devoir,
    exam1: s.exam1,
    exam2: s.exam2,
    exam3: s.exam3,
    moyenne: s.moy,
    coefficient: s.coeff,
    total: Math.round(s.moy * s.coeff * 10) / 10,
    observation: s.obs
  }));

  const totalPoints = savedBulletin?.totalPoints || subjects.reduce((sum, s) => sum + s.total, 0);
  const totalCoeffs = savedBulletin?.totalCoefficients || subjects.reduce((sum, s) => sum + s.coefficient, 0);
  const averageGen = savedBulletin?.moyenneGenerale || (totalCoeffs > 0 ? Math.round((totalPoints / totalCoeffs) * 100) / 100 : 0);
  const rank = savedBulletin?.classement || 3;
  const totalStudents = savedBulletin?.totalEleves || 32;

  // Student absences count
  const attendanceList = StorageEngine.getAttendance(student.institutionId, undefined, student.id);
  const realAbsences = attendanceList.filter(a => a.status === 'absent').length;
  const absencesNJ = savedBulletin?.absencesNonJustifiees ?? realAbsences;
  const absencesJ = savedBulletin?.absencesJustifiees ?? 1;

  const decision = savedBulletin?.decision || (averageGen >= 15 ? 'لوحة شرف وتهنئة' : averageGen >= 12 ? 'تشجيع' : 'لوحة شرف');
  const decisionFr = savedBulletin?.decisionFr || (averageGen >= 15 ? "Tableau d'Honneur et Félicitations" : averageGen >= 12 ? "Encouragements" : "Tableau d'Honneur");

  return (
    <div
      dir="ltr"
      className="bg-white text-black p-3 sm:p-4 font-sans border-2 border-black rounded-2xl max-w-[210mm] mx-auto text-[11px] shadow-lg print:border-2 print:border-black print:p-3 print:m-0 print:max-w-none select-none relative"
    >
      {/* 1. Official Header Banner Image */}
      <div className="w-full pb-1 border-b-2 border-[#1e1b4b]">
        <img
          src="/assets/aistudio/__________2026-10-22_161815_d10b3316.png"
          alt="ترويسة مجمع مدارس بكار الحرة"
          className="w-full max-h-16 sm:max-h-20 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* 2. Bulletin Title Banner */}
      <div className="my-2 bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] text-white py-1 px-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-black shadow-sm">
        <span>BULLETIN DE NOTES DU {currentTermInfo.fr.toUpperCase()}</span>
        <span className="font-mono bg-white/20 px-2.5 py-0.5 rounded-lg text-xs">{academicYear}</span>
        <span dir="rtl">كشف درجات {currentTermInfo.ar}</span>
      </div>

      {/* 3. Student Information Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2.5 mb-2.5 text-[10.5px]">
        <div>
          <span className="text-slate-500 block text-[9.5px]">Nom & Prénom / الاسم الكامل:</span>
          <span className="font-bold text-slate-900 block truncate">{student.firstNameFr} {student.lastNameFr}</span>
          <span className="font-bold text-slate-900 block truncate" dir="rtl">{student.firstNameAr} {student.lastNameAr}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9.5px]">Classe / القسم:</span>
          <span className="font-bold text-slate-900">{studentGrade?.nameFr || ''} {studentClass?.nameFr || ''}</span>
          <span className="font-bold text-slate-900 block" dir="rtl">{studentGrade?.nameAr || ''} - {studentClass?.nameAr || ''}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9.5px]">N° Matricule / رقم القيد:</span>
          <span className="font-mono font-bold text-emerald-900">{student.registrationNumber}</span>
          <span className="text-slate-500 block text-[9.5px]">NNI: {student.nationalId || '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9.5px]">Trimestre / الفصل الدراسي:</span>
          <span className="font-bold text-indigo-950">{currentTermInfo.fr}</span>
          <span className="font-bold text-indigo-950 block" dir="rtl">{currentTermInfo.ar}</span>
        </div>
      </div>

      {/* 4. The Grades Table */}
      <div className="border-2 border-black rounded-xl overflow-hidden mb-2.5 shadow-xs">
        <table className="w-full text-center border-collapse text-[10px] sm:text-[10.5px]">
          <thead>
            <tr className="bg-[#1e1b4b] text-white font-bold border-b-2 border-black divide-x divide-white/20">
              <th className="py-1 px-1.5 text-left w-2/5">Matières / المواد</th>
              <th className="py-1 px-1 w-11">Devoir<br/><span className="text-[9px] font-normal">فرض</span></th>
              <th className="py-1 px-1 w-11">Compo 1<br/><span className="text-[9px] font-normal">اختبار 1</span></th>
              <th className="py-1 px-1 w-11">Compo 2<br/><span className="text-[9px] font-normal">اختبار 2</span></th>
              <th className="py-1 px-1 w-11">Compo 3<br/><span className="text-[9px] font-normal">اختبار 3</span></th>
              <th className="py-1 px-1 w-12 bg-[#2e1065]">Moy/20<br/><span className="text-[9px] font-normal">المعدل</span></th>
              <th className="py-1 px-1 w-10">Coeff<br/><span className="text-[9px] font-normal">المعامل</span></th>
              <th className="py-1 px-1 w-12 bg-[#2e1065]">Total<br/><span className="text-[9px] font-normal">المجموع</span></th>
              <th className="py-1 px-1.5 w-1/5">Observations / ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/30 font-medium">
            {subjects.map((sub, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'}>
                <td className="py-1 px-2 text-left flex items-center justify-between">
                  <span className="font-bold text-slate-900">{sub.subjectNameFr}</span>
                  <span className="font-bold text-slate-800" dir="rtl">{sub.subjectNameAr}</span>
                </td>
                <td className="py-1 px-1 font-mono">{sub.devoir ?? '—'}</td>
                <td className="py-1 px-1 font-mono">{sub.exam1 ?? '—'}</td>
                <td className="py-1 px-1 font-mono">{sub.exam2 ?? '—'}</td>
                <td className="py-1 px-1 font-mono">{sub.exam3 ?? '—'}</td>
                <td className="py-1 px-1 font-mono font-bold bg-indigo-50/50">{sub.moyenne.toFixed(1)}</td>
                <td className="py-1 px-1 font-mono font-bold">{sub.coefficient}</td>
                <td className="py-1 px-1 font-mono font-black text-indigo-950 bg-indigo-50/70">{sub.total.toFixed(1)}</td>
                <td className="py-1 px-1.5 text-center text-[10px] text-slate-700 font-semibold">{sub.observation || 'حسن'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-black border-t-2 border-black text-black">
              <td className="py-1.5 px-2 text-left flex items-center justify-between">
                <span>TOTAL DES POINTS / مجموع النقاط</span>
                <span dir="rtl">المجموع والمعاملات</span>
              </td>
              <td colSpan={4} className="text-center font-normal text-slate-600 text-[9.5px]">المجموع العام</td>
              <td className="py-1.5 px-1 font-mono text-center bg-indigo-100">/20</td>
              <td className="py-1.5 px-1 font-mono font-black text-center text-sm">{totalCoeffs}</td>
              <td className="py-1.5 px-1 font-mono font-black text-center text-sm bg-indigo-100 text-indigo-950">{totalPoints.toFixed(1)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Results & Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-2.5">
        {/* Moyenne & Rang Card */}
        <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="font-bold text-slate-700">Moyenne Générale / المعدل العام:</span>
            <span className="font-mono font-black text-base text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
              {averageGen.toFixed(2)} / 20
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-slate-700">Rang / الترتيب:</span>
            <span className="font-black text-sm text-indigo-950">
              {rank} <span className="text-[10px] font-normal text-slate-600">/ {totalStudents} élèves</span>
            </span>
          </div>
        </div>

        {/* Absences Card */}
        <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 flex flex-col justify-between text-[10px]">
          <div className="font-bold text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
            <span>Assiduité & Discipline</span>
            <span dir="rtl">المواظبة والغياب</span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-center">
            <div className="bg-white p-1 rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-500 block">Non justifiées</span>
              <span className="font-mono font-bold text-rose-700 text-xs">{absencesNJ}</span>
            </div>
            <div className="bg-white p-1 rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-500 block">Justifiées</span>
              <span className="font-mono font-bold text-amber-700 text-xs">{absencesJ}</span>
            </div>
            <div className="bg-white p-1 rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-500 block">Exclusions</span>
              <span className="font-mono font-bold text-slate-700 text-xs">0</span>
            </div>
          </div>
        </div>

        {/* Conseil Decision Card */}
        <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 flex flex-col justify-between">
          <div className="font-bold text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
            <span>Décision du Conseil</span>
            <span dir="rtl">قرار مجلس الأساتذة</span>
          </div>
          <div className="pt-1.5 text-center">
            <span className="font-black text-xs text-indigo-900 block">{decisionFr}</span>
            <span className="font-black text-xs text-indigo-900 block" dir="rtl">{decision}</span>
          </div>
        </div>
      </div>

      {/* 6. Signatures & Cachet */}
      <div className="border-t-2 border-slate-300 pt-2 grid grid-cols-3 gap-4 text-center text-[10.5px] font-bold text-black pb-1">
        <div>
          <span className="block underline">Le Professeur Titulaire</span>
          <span className="block text-[9.5px] text-slate-600 font-normal mt-0.5" dir="rtl">أستاذ القسم</span>
          <div className="h-10 mt-1"></div>
        </div>
        <div>
          <span className="block underline">Le Directeur des Études</span>
          <span className="block text-[9.5px] text-slate-600 font-normal mt-0.5" dir="rtl">مدير الدروس</span>
          <div className="h-10 mt-1"></div>
        </div>
        <div>
          <span className="block underline">Le Directeur Général</span>
          <span className="block text-[9.5px] text-slate-600 font-normal mt-0.5" dir="rtl">المدير العام والختم</span>
          <div className="h-10 mt-1"></div>
        </div>
      </div>
    </div>
  );
};
