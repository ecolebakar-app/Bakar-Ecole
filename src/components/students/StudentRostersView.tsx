/**
 * Student Rosters View (قوائم التلاميذ الرسمية)
 * Formats official student lists by class and section with print-ready tables
 * Featuring the school emblem logo & official header layout.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import {
  Users,
  Printer,
  Download,
  Filter,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const StudentRostersView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId]);
  const grades = useMemo(() => StorageEngine.getGrades(institutionId, sectionId), [institutionId, sectionId]);
  const students = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId]);
  const guardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedGradeId !== 'all' && s.gradeId !== selectedGradeId) return false;
      if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
      if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = s.firstNameAr.includes(q) || s.lastNameAr.includes(q) ||
          s.firstNameFr.toLowerCase().includes(q) || s.lastNameFr.toLowerCase().includes(q) ||
          s.registrationNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [students, selectedGradeId, selectedClassId, genderFilter, searchQuery]);

  const currentClassObj = classes.find(c => c.id === selectedClassId);
  const currentGradeObj = grades.find(g => g.id === selectedGradeId);

  const handleExportExcel = () => {
    const wsData = [
      [`مجمع مدارس بكار الحرة - قائمة التلاميذ`],
      [`المؤسسة: ${currentInstitution.nameAr}`, `السنة الدراسية: 2026 - 2027`],
      [''],
      ['الرقم', 'الاسم بالعربية', 'الاسم بالفرنسية', 'الجنس', 'تاريخ الميلاد', 'مكان الميلاد', 'اسم ولي الأمر', 'هاتف الوكيل']
    ];

    filteredStudents.forEach((s, idx) => {
      const g = guardians.find(guard => guard.id === s.guardianId);
      wsData.push([
        String(idx + 1),
        `${s.firstNameAr} ${s.lastNameAr}`,
        `${s.firstNameFr} ${s.lastNameFr}`,
        s.gender === 'male' ? 'ذكر' : 'أنثى',
        s.birthDate,
        s.birthPlace,
        g?.nameAr || '—',
        g?.phone1 || '—'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قائمة التلاميذ');
    XLSX.writeFile(wb, `liste_eleves_${selectedClassId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Print Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              السجلات المدرسية الرسمية
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">قوائم الفصول</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>قوائم التلاميذ (Listes des Élèves)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            توليد وتصدير وطباعة قوائم التلاميذ المعتمدة لكل قسم وفصل دراسي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>تصدير إكسل</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة القائمة الرسمية</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Hidden in print) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم التلميذ..."
            className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div>
          <select
            value={selectedGradeId}
            onChange={(e) => setSelectedGradeId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">كل المراحل والسنوات</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.nameAr} ({g.code})</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">كل الفصول والأقسام</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.nameAr} ({c.nameFr})</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">الكل (ذكور وإناث)</option>
            <option value="male">ذكور فقط</option>
            <option value="female">إناث فقط</option>
          </select>
        </div>
      </div>

      {/* Official Printable Roster Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 print:p-0 print:border-none print:shadow-none">
        {/* Official School Header Banner Image */}
        <div className="w-full pb-3 mb-4 border-b-2 border-[#1e1b4b]">
          <img
            src="/assets/aistudio/__________2026-10-22_161815_d10b3316.png"
            alt="ترويسة مجمع مدارس بكار الحرة"
            className="w-full max-h-20 sm:max-h-24 object-contain mx-auto"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* List Title */}
        <div className="text-center mb-6">
          <h3 className="text-base font-black text-slate-900">
            قائمة تلاميذ الفصل الدراسي (Liste Officielle des Élèves)
          </h3>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-600 font-semibold mt-1">
            <span>القسم: {currentClassObj?.nameAr || currentGradeObj?.nameAr || 'كافة الفصول'}</span>
            <span>·</span>
            <span>السنة الدراسية: 2026 - 2027</span>
            <span>·</span>
            <span>العدد الإجمالي: {filteredStudents.length} تلميذ</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border border-slate-300 text-center w-12">الرقم</th>
                <th className="p-2 border border-slate-300">اسم التلميذ بالعربية</th>
                <th className="p-2 border border-slate-300 text-left font-mono">Nom de l'élève</th>
                <th className="p-2 border border-slate-300 text-center w-16">الجنس</th>
                <th className="p-2 border border-slate-300 text-center font-mono">تاريخ الميلاد</th>
                <th className="p-2 border border-slate-300">ولي الأمر (الوكيل)</th>
                <th className="p-2 border border-slate-300 font-mono text-center">هاتف الاتصال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((s, idx) => {
                const guardian = guardians.find(g => g.id === s.guardianId);
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-700">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">{s.firstNameAr} {s.lastNameAr}</td>
                    <td className="p-2 border border-slate-300 font-mono text-slate-700 text-left">{s.firstNameFr} {s.lastNameFr}</td>
                    <td className="p-2 border border-slate-300 text-center font-medium">
                      {s.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-600">{s.birthDate}</td>
                    <td className="p-2 border border-slate-300 text-slate-800">{guardian?.nameAr || '—'}</td>
                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-700">{guardian?.phone1 || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Signature */}
        <div className="mt-8 pt-4 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span>تاريخ إصدار القائمة: </span>
            <span className="font-mono">{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="text-center">
            <span className="font-bold block mb-10">توقيع وختم المدير العام</span>
            <span className="text-[10px] text-slate-400 font-mono">ECOLE BEKAR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
