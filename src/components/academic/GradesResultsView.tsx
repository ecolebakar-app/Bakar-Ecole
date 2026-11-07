/**
 * Academic Grades & Results View (النتائج والاختبارات وكشوف الدرجات)
 * Implements:
 * 1. Primary School System: "نظام المجموع" with Exact Replica Bulletin de Notes
 *    (Adaptable primary subjects from 1st to 4th year and upper primary)
 * 2. Middle & Secondary System: "نظام الضوارب / المعاملات" (Weighted Coefficients)
 * 3. Instant One-Click Official Print & Export
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Student } from '../../types';
import {
  Award,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  School,
  Building2,
  ChevronDown
} from 'lucide-react';
import { PrintableBulletin } from './PrintableBulletin';
import { PrintableSecondaryBulletin } from './PrintableSecondaryBulletin';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';

export const GradesResultsView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId } = useApp();

  const [selectedTerm, setSelectedTerm] = useState<'term_1' | 'term_2' | 'term_3'>('term_1');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student for printing/previewing bulletin
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  const grades = useMemo(() => StorageEngine.getGrades(institutionId, sectionId), [institutionId, sectionId]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId]);
  const allStudents = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (selectedGradeId !== 'all' && s.gradeId !== selectedGradeId) return false;
      if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.firstNameAr.includes(q) || s.lastNameAr.includes(q) ||
          s.firstNameFr.toLowerCase().includes(q) || s.lastNameFr.toLowerCase().includes(q) ||
          s.registrationNumber.toLowerCase().includes(q);
        if (!matchName) return false;
      }
      return true;
    });
  }, [allStudents, selectedGradeId, selectedClassId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {institutionId === 'institut' ? 'نظام المجموع الابتدائي (1 إلى 4)' : 'نظام كشوف الدرجات والامتحانات'}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">2026 - 2027</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>النتائج المدرسية وكشوف الدرجات الرسمية (Bulletins de Notes)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إصدار وطباعة كشف الدرجات الرسمي المعتمد لمجمع مدارس بكار الحرة ومعهد التربية الحديثة (نسخة طبق الأصل)
          </p>
        </div>

        {/* Term Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedTerm('term_1')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedTerm === 'term_1' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الفصل الأول (1er Trimestre)
          </button>
          <button
            onClick={() => setSelectedTerm('term_2')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedTerm === 'term_2' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الفصل الثاني
          </button>
          <button
            onClick={() => setSelectedTerm('term_3')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedTerm === 'term_3' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الفصل الثالث
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم التلميذ أو رقم التسجيل..."
            className="w-full pr-10 pl-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs placeholder:text-slate-400"
          />
        </div>

        {/* Grade Filter */}
        <div className="relative">
          <select
            value={selectedGradeId}
            onChange={(e) => setSelectedGradeId(e.target.value)}
            className="w-full appearance-none pr-3.5 pl-9 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs cursor-pointer"
          >
            <option value="all">كل السنوات والمراحل</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>
                {g.nameAr} ({g.code})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full appearance-none pr-3.5 pl-9 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs cursor-pointer"
          >
            <option value="all">كل الفصول والأقسام</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nameAr} ({c.nameFr})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Primary vs Middle/Secondary Explainer Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>نظام التقييم المعتمد: </strong>
            للمرحلة الابتدائية (السنوات 1-4 في المعهد، و1-6 في المدرسة) يُعتمد <strong>نظام المجموع</strong> مع جدول التركيب المزدوج (مواد العربية / مواد الفرنسية)، وللمرحلة الإعدادية والثانوية يُعتمد <strong>نظام الضوارب والمعاملات</strong>.
          </span>
        </div>
        <span className="font-mono font-bold text-emerald-800 text-[11px] shrink-0">
          نموذج 2026-2027
        </span>
      </div>

      {/* Students Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            قائمة التلاميذ المؤهلين لكشوف الدرجات ({filteredStudents.length} تلميذ)
          </div>
          <button
            onClick={() => {
              if (filteredStudents.length > 0) setPreviewStudent(filteredStudents[0]);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>معاينة كشف أول تلميذ</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">الرقم</th>
                <th className="py-3.5 px-4">اسم التلميذ (عربي / فرنسي)</th>
                <th className="py-3.5 px-4">السنة / الفصل</th>
                <th className="py-3.5 px-4 text-center">نظام التقييم</th>
                <th className="py-3.5 px-4 text-center">المعدل التقديري</th>
                <th className="py-3.5 px-4 text-center">الرتبة</th>
                <th className="py-3.5 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu, idx) => {
                const stuClass = classes.find(c => c.id === stu.classId);
                const stuGrade = grades.find(g => g.id === stu.gradeId);
                const isPrimary = stuGrade?.stage === 'primary' || institutionId === 'institut';

                return (
                  <tr key={stu.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">{stu.firstNameAr} {stu.lastNameAr}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{stu.firstNameFr} {stu.lastNameFr}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {stuGrade?.nameAr || '—'}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {stuClass?.nameFr || stuClass?.nameAr || ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        {isPrimary ? 'نظام المجموع (ابتدائي)' : 'نظام المعاملات'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {isPrimary ? '8.45 / 10' : '14.20 / 20'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">
                      {idx + 1} / {filteredStudents.length}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setPreviewStudent(stu)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 text-slate-700 hover:text-white text-xs font-bold border border-slate-200 hover:border-emerald-600 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer mx-auto"
                        title="معاينة وطباعة كشف الدرجات طبق الأصل"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                        <span>كشف الدرجات</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Exact Replica Bulletin Preview & Print */}
      {previewStudent && (() => {
        const previewStudentGrade = grades.find(g => g.id === previewStudent.gradeId);
        const isSecondaryOrMiddle = previewStudentGrade?.stage === 'middle' || previewStudentGrade?.stage === 'secondary';

        return (
          <PrintPreviewModal
            isOpen={true}
            onClose={() => setPreviewStudent(null)}
            title={`كشف الدرجات الرسمي (${isSecondaryOrMiddle ? 'إعدادي وثانوي' : 'ابتدائي'}) - ${previewStudent.firstNameAr} ${previewStudent.lastNameAr}`}
            documentNumber={previewStudent.nationalId || undefined}
          >
            {isSecondaryOrMiddle ? (
              <PrintableSecondaryBulletin
                student={previewStudent}
                term={selectedTerm}
                academicYear="2025-2026"
              />
            ) : (
              <PrintableBulletin
                student={previewStudent}
                term={selectedTerm}
                academicYear="2025-2026"
              />
            )}
          </PrintPreviewModal>
        );
      })()}
    </div>
  );
};
