/**
 * Student List Management Component for Ecole Bekar
 * Features:
 * - Search by name / registration number
 * - Filter by Grade, Class, and Exemption Status
 * - Quick Action to Profile & Financial Account
 * - Direct "قبض دفعة" action
 * - Export to Excel (.xlsx) & PDF/Print
 * - Toggle to 5-step Registration Wizard
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Student } from '../../types';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  CreditCard,
  Eye,
  Edit,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import { StudentRegistrationWizard } from './StudentRegistrationWizard';
import { StudentProfileModal } from './StudentProfileModal';
import { EditStudentModal } from './EditStudentModal';
import * as XLSX from 'xlsx';

export const StudentList: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, setQuickPaymentOpen, refreshKey, reloadAll } = useApp();

  const [mode, setMode] = useState<'list' | 'register'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedExemption, setSelectedExemption] = useState('all');

  // Selected student for profile modal
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  // Selected student for editing modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const students = useMemo(() => {
    return StorageEngine.getStudents(institutionId, sectionId);
  }, [institutionId, sectionId, refreshKey]);

  const grades = useMemo(() => StorageEngine.getGrades(institutionId, sectionId), [institutionId, sectionId]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId]);
  const guardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId]);

  // Filtered List
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedGrade !== 'all' && s.gradeId !== selectedGrade) return false;
      if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
      if (selectedExemption !== 'all') {
        if (selectedExemption === 'exempted' && s.exemptionType === 'none') return false;
        if (selectedExemption === 'standard' && s.exemptionType !== 'none') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.firstNameAr.includes(q) || s.lastNameAr.includes(q) ||
          s.firstNameFr.toLowerCase().includes(q) || s.lastNameFr.toLowerCase().includes(q);
        const matchReg = s.registrationNumber.toLowerCase().includes(q);
        if (!matchName && !matchReg) return false;
      }
      return true;
    });
  }, [students, selectedGrade, selectedClass, selectedExemption, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredStudents.map(s => {
      const g = grades.find(item => item.id === s.gradeId);
      const c = classes.find(item => item.id === s.classId);
      const guard = guardians.find(item => item.id === s.guardianId);
      return {
        'رقم القيد': s.registrationNumber,
        'الاسم بالعربية': `${s.firstNameAr} ${s.lastNameAr}`,
        'Nom et Prénom': `${s.firstNameFr} ${s.lastNameFr}`,
        'المرحلة': g?.nameAr || '—',
        'الفصل': c?.nameAr || '—',
        'الجنس': s.gender === 'male' ? 'ذكر' : 'أنثى',
        'تاريخ الميلاد': s.birthDate,
        'ولي الأمر': guard?.nameAr || '—',
        'هاتف الوكيل': guard?.phone1 || '—',
        'حالة الرسوم': s.exemptionType !== 'none' ? 'مستفيد من خصم/إعفاء' : 'عادي',
        'الحالة الأكاديمية': s.status === 'active' ? 'نشط' : s.status
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التلاميذ');
    XLSX.writeFile(wb, `ecole_bekar_students_${institutionId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (mode === 'register') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode('list')}
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5"
        >
          ← العودة إلى قائمة التلاميذ
        </button>
        <StudentRegistrationWizard
          onSuccess={(s) => {
            setMode('list');
            reloadAll();
          }}
          onCancel={() => setMode('list')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span>إدارة شؤون التلاميذ - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة السجلات الأكاديمية والمالية والحسابات الفردية لكل تلميذ
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>تصدير إكسل</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>طباعة القائمة</span>
          </button>
          <button
            onClick={() => setMode('register')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-xs shadow-blue-900/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل تلميذ جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar: Modern Elevated Container */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم التلميذ..."
            className="w-full pr-10 pl-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden bg-slate-50/70 hover:bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Grade filter */}
        <div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden bg-slate-50/70 hover:bg-slate-50 focus:bg-white transition-all cursor-pointer text-slate-700"
          >
            <option value="all">كافة المراحل / السنوات</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.nameAr} ({g.nameFr})</option>
            ))}
          </select>
        </div>

        {/* Class filter */}
        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden bg-slate-50/70 hover:bg-slate-50 focus:bg-white transition-all cursor-pointer text-slate-700"
          >
            <option value="all">كافة الفصول الدراسية</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.nameAr}</option>
            ))}
          </select>
        </div>

        {/* Exemption filter */}
        <div>
          <select
            value={selectedExemption}
            onChange={(e) => setSelectedExemption(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden bg-slate-50/70 hover:bg-slate-50 focus:bg-white transition-all cursor-pointer text-slate-700"
          >
            <option value="all">كافة حالات الرسوم</option>
            <option value="standard">يدفع كامل الرسوم</option>
            <option value="exempted">أصحاب الخصومات والإعفاءات</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>قائمة التلاميذ المسجلين ({filteredStudents.length})</span>
          <span>السنة الدراسية: 2025-2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">الرقم</th>
                <th className="py-3 px-4 font-bold">اسم التلميذ</th>
                <th className="py-3 px-4 font-bold">المرحلة / الفصل</th>
                <th className="py-3 px-4 font-bold">ولي الأمر (الوكيل)</th>
                <th className="py-3 px-4 font-bold">حالة الرسوم</th>
                <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, idx) => {
                  const g = grades.find(item => item.id === s.gradeId);
                  const c = classes.find(item => item.id === s.classId);
                  const guard = guardians.find(item => item.id === s.guardianId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono font-bold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.firstNameAr} {s.lastNameAr}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.firstNameFr} {s.lastNameFr}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{g?.nameAr || '—'}</span>
                        <span className="block text-[10px] text-slate-500">{c?.nameAr || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{guard?.nameAr || '—'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{guard?.phone1 || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.exemptionType === 'full' ? 'bg-indigo-100 text-indigo-800' :
                          s.exemptionType === 'brother_discount' ? 'bg-emerald-100 text-emerald-800' :
                          s.exemptionType === 'partial' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {s.exemptionType === 'full' ? 'معفى كلياً' :
                           s.exemptionType === 'brother_discount' ? 'خصم إخوة' :
                           s.exemptionType === 'partial' ? 'خصم جزئي' : 'عادي'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Student Info */}
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                            title="تعديل بيانات التلميذ"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* View Profile & Financial Ledger */}
                          <button
                            onClick={() => setProfileStudent(s)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="عرض الملف والحساب المالي"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Direct Collect Payment */}
                          <button
                            onClick={() => {
                              setQuickPaymentOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="تسجيل دفعة نقدية"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    لا يوجد تلاميذ مطابقون لمعايير البحث الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Modal */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          isOpen={true}
          onClose={() => setProfileStudent(null)}
          onCollectPayment={(s) => {
            setProfileStudent(null);
            setQuickPaymentOpen(true);
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => reloadAll()}
        />
      )}
    </div>
  );
};
