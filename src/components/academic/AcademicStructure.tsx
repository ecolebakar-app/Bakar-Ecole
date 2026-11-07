/**
 * Unified Academic Structure Component for Ecole Bekar
 * Conforms to Executive Specification §3:
 * Single screen with tabs:
 * 1. المراحل والسنوات (Grades & Years - Strictly primary 1-4 for institute; unrestricted for school)
 * 2. الفصول الدراسية (Classes - name, capacity, enrolled count, available seats)
 * 3. المواد وجدول الحصص (Subjects & Timetable - STRICTLY NO rooms/places; conflict validation)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Grade, ClassRoom, Subject, TimetableSlot } from '../../types';
import {
  Network,
  Layers,
  School,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Calendar,
  X,
  BookOpen,
  Award,
  Sliders,
  Edit3,
  Filter
} from 'lucide-react';

export const AcademicStructure: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, showToast, refreshKey, reloadAll } = useApp();

  const [activeTab, setActiveTab] = useState<'grades' | 'classes' | 'subjects' | 'timetable'>('grades');

  // Grades Modal Form
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [gradeNameAr, setGradeNameAr] = useState('');
  const [gradeNameFr, setGradeNameFr] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [gradeOrder, setGradeOrder] = useState<number>(1);
  const [gradeStage, setGradeStage] = useState<Grade['stage']>('primary');

  // Classes Modal Form
  const [showAddClass, setShowAddClass] = useState(false);
  const [classNameAr, setClassNameAr] = useState('');
  const [classNameFr, setClassNameFr] = useState('');
  const [classGradeId, setClassGradeId] = useState('');
  const [classCapacity, setClassCapacity] = useState<number>(40);
  const [classMonthlyFee, setClassMonthlyFee] = useState<number>(2000);
  const [classRegFee, setClassRegFee] = useState<number>(1500);

  // Subjects Management (Dedicated Feature)
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectNameAr, setSubjectNameAr] = useState('');
  const [subjectNameFr, setSubjectNameFr] = useState('');
  const [subjectGradeId, setSubjectGradeId] = useState('');
  const [subjectClassId, setSubjectClassId] = useState('all');
  const [subjectCategory, setSubjectCategory] = useState<Subject['category']>('arabic');
  const [subjectMaxScore, setSubjectMaxScore] = useState<number>(50); // For Primary/Preschool: "المجموع"
  const [subjectCoefficient, setSubjectCoefficient] = useState<number>(2); // For Middle/Secondary: "الضارب"
  const [subjectWeeklyHours, setSubjectWeeklyHours] = useState<number>(4);
  const [subjectTeacherId, setSubjectTeacherId] = useState('');
  const [subjectFilterGrade, setSubjectFilterGrade] = useState('all');
  const [subjectFilterCategory, setSubjectFilterCategory] = useState('all');

  // Timetable Modal Form (strictly NO rooms/places!)
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotClassId, setSlotClassId] = useState('');
  const [slotSubjectId, setSlotSubjectId] = useState('');
  const [slotTeacherId, setSlotTeacherId] = useState('');
  const [slotDay, setSlotDay] = useState<number>(0); // 0: Sunday
  const [slotStartTime, setSlotStartTime] = useState('08:00');
  const [slotEndTime, setSlotEndTime] = useState('09:00');

  // Data
  const grades = useMemo(() => StorageEngine.getGrades(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const subjects = useMemo(() => StorageEngine.getSubjects(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const teachers = useMemo(() => StorageEngine.getTeachers(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const timetable = useMemo(() => StorageEngine.getTimetable(institutionId, sectionId), [institutionId, sectionId, refreshKey]);
  const students = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId, refreshKey]);

  // Set default grade selection for classes & subjects form
  React.useEffect(() => {
    if (grades.length > 0 && !classGradeId) {
      setClassGradeId(grades[0].id);
    }
    if (grades.length > 0 && !subjectGradeId) {
      setSubjectGradeId(grades[0].id);
    }
  }, [grades, classGradeId, subjectGradeId]);

  // Handle Save Subject (Primary uses maxScore / المجموع, Middle & Secondary use coefficient / الضارب)
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameAr || !subjectGradeId) {
      showToast('يرجى إدخال اسم المادة وتحديد المرحلة الدراسية', 'error');
      return;
    }

    const selectedGrade = grades.find(g => g.id === subjectGradeId);
    const isPrimaryStage = selectedGrade?.stage === 'primary' || selectedGrade?.stage === 'preschool' || institutionId === 'institut';

    const newSubject: Subject = {
      id: editingSubject ? editingSubject.id : `sbj-${Date.now()}`,
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      gradeId: subjectGradeId,
      classId: subjectClassId !== 'all' ? subjectClassId : undefined,
      nameAr: subjectNameAr,
      nameFr: subjectNameFr || subjectNameAr,
      category: subjectCategory,
      maxScore: isPrimaryStage ? Number(subjectMaxScore) : undefined,
      coefficient: isPrimaryStage ? 1 : Number(subjectCoefficient),
      weeklyHours: Number(subjectWeeklyHours),
      teacherId: subjectTeacherId || undefined
    };

    StorageEngine.saveSubject(newSubject);
    showToast(editingSubject ? 'تم تعديل المادة بنجاح' : 'تمت إضافة المادة الدراسية بنجاح', 'success');
    setShowAddSubject(false);
    setEditingSubject(null);
    setSubjectNameAr('');
    setSubjectNameFr('');
    reloadAll();
  };

  const handleOpenEditSubject = (sbj: Subject) => {
    setEditingSubject(sbj);
    setSubjectNameAr(sbj.nameAr);
    setSubjectNameFr(sbj.nameFr);
    setSubjectGradeId(sbj.gradeId);
    setSubjectClassId(sbj.classId || 'all');
    setSubjectCategory(sbj.category);
    setSubjectMaxScore(sbj.maxScore || 50);
    setSubjectCoefficient(sbj.coefficient || 2);
    setSubjectWeeklyHours(sbj.weeklyHours || 4);
    setSubjectTeacherId(sbj.teacherId || '');
    setShowAddSubject(true);
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف مادة "${name}"؟`)) {
      StorageEngine.deleteSubject(id);
      showToast('تم حذف المادة بنجاح', 'success');
      reloadAll();
    }
  };

  // Handle Add Grade
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (institutionId === 'institut') {
      if (gradeOrder < 1 || gradeOrder > 4 || gradeStage !== 'primary') {
        showToast('معهد التربية الحديثة مخصص حصرياً للسنوات الأربع الابتدائية (من الأولى إلى الرابعة)', 'error');
        return;
      }
    }

    const newGrade: Grade = {
      id: `grd-${Date.now()}`,
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      academicYearId: 'year-2025-2026',
      nameAr: gradeNameAr,
      nameFr: gradeNameFr || gradeNameAr,
      code: gradeCode || `G-${gradeOrder}`,
      order: Number(gradeOrder),
      stage: gradeStage,
      isActive: true
    };

    const res = StorageEngine.saveGrade(newGrade);
    if (res.success) {
      showToast('تمت إضافة المرحلة/السنة بنجاح', 'success');
      setShowAddGrade(false);
      setGradeNameAr('');
      setGradeNameFr('');
      setGradeCode('');
      reloadAll();
    } else {
      showToast(res.message || 'خطأ في الحفظ', 'error');
    }
  };

  // Handle Add Class
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classGradeId) {
      showToast('يرجى اختيار المرحلة أولاً', 'error');
      return;
    }

    const newClass: ClassRoom = {
      id: `cls-${Date.now()}`,
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      gradeId: classGradeId,
      academicYearId: 'year-2025-2026',
      nameAr: classNameAr,
      nameFr: classNameFr || classNameAr,
      capacity: Number(classCapacity),
      isActive: true
    };

    StorageEngine.saveClass(newClass);
    showToast('تمت إضافة الفصل بنجاح', 'success');
    setShowAddClass(false);
    setClassNameAr('');
    setClassNameFr('');
    reloadAll();
  };

  // Handle Add Timetable Slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotClassId || !slotSubjectId || !slotTeacherId) {
      showToast('يرجى ملء جميع حقول الحصة', 'error');
      return;
    }

    const newSlot: TimetableSlot = {
      id: `slot-${Date.now()}`,
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      academicYearId: 'year-2025-2026',
      classId: slotClassId,
      subjectId: slotSubjectId,
      teacherId: slotTeacherId,
      dayOfWeek: Number(slotDay),
      startTime: slotStartTime,
      endTime: slotEndTime,
      status: 'scheduled'
    };

    const res = StorageEngine.saveTimetableSlot(newSlot);
    if (res.success) {
      showToast('تمت جدولة الحصة بنجاح', 'success');
      setShowAddSlot(false);
      reloadAll();
    } else {
      showToast(res.message || 'تعارض في الجدولة!', 'error');
    }
  };

  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-600" />
            <span>الهيكل الأكاديمي وجداول الحصص - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            مكان موحد لإدارة المراحل والسنوات، الفصول، وجدول الحصص الأسبوعي (خالٍ من أي تعقيد للأماكن أو الغرف)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl text-xs font-bold border border-slate-200/70 shadow-2xs">
          <button
            onClick={() => setActiveTab('grades')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'grades'
                ? 'bg-white shadow-xs text-blue-700 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المراحل والسنوات
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-white shadow-xs text-blue-700 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الفصول الدراسية
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-white shadow-xs text-blue-700 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المواد والمناهج (المجموع / المعامل)
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'timetable'
                ? 'bg-white shadow-xs text-blue-700 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            جدول الحصص
          </button>
        </div>
      </div>

      {/* Institutional Isolation Notice */}
      {institutionId === 'institut' ? (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">القاعدة المؤسسية للمعهد:</span>
            معهد التربية الحديثة للعلوم الإسلامية مخصص حصرياً للمرحلة الابتدائية من السنة الأولى إلى السنة الرابعة (1AS إلى 4AS).
            أسماء السنوات ورموزها الفرنسية مفتوحة وقابلة للتهيئة المباشرة من قبل المدير.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-50/80 border border-blue-200/90 rounded-2xl flex items-start gap-3 text-xs text-blue-900 shadow-2xs">
          <School className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">هيكل المدرسة الخاصة:</span>
            المدرسة تحتفظ بجميع مراحلها وسنواتها التعليمية القائمة (ابتدائي، إعدادي، ثانوي) مع عزل تام عن معهد التربية الحديثة.
          </div>
        </div>
      )}

      {/* TAB 1: GRADES & YEARS */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">
              المراحل والسنوات الأكاديمية ({grades.length})
            </h3>
            <button
              onClick={() => setShowAddGrade(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سنة / مرحلة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {grades.map(g => {
              const enrolledInGrade = students.filter(s => s.gradeId === g.id).length;
              const classesInGrade = classes.filter(c => c.gradeId === g.id).length;
              return (
                <div key={g.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {g.code || `ترتيب ${g.order}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {g.stage === 'primary' ? 'ابتدائي' : g.stage === 'middle' ? 'إعدادي' : 'ثانوي'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{g.nameAr}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{g.nameFr}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                    <span>الفصول: <strong className="text-slate-800">{classesInGrade}</strong></span>
                    <span>التلاميذ: <strong className="text-blue-600 font-mono">{enrolledInGrade}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">
              الفصول الدراسية ({classes.length})
            </h3>
            <button
              onClick={() => setShowAddClass(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فصل جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">اسم الفصل</th>
                    <th className="py-3.5 px-4">المرحلة / السنة</th>
                    <th className="py-3.5 px-4">السعة القصوى</th>
                    <th className="py-3.5 px-4">التلاميذ الحاليون</th>
                    <th className="py-3.5 px-4">المقاعد المتاحة</th>
                    <th className="py-3.5 px-4 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map(c => {
                    const g = grades.find(item => item.id === c.gradeId);
                    const count = students.filter(s => s.classId === c.id).length;
                    const available = Math.max(0, c.capacity - count);
                    return (
                      <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-950 transition-colors">{c.nameAr}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{g?.nameAr}</td>
                        <td className="py-3.5 px-4 font-mono">{c.capacity} مقعد</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{count} تلميذ</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600">{available} مقعد شاغر</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            نشط ✓
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
      )}

      {/* TAB 3: SUBJECTS & CURRICULA (Requested: ضف خاصية إضافة مواد كل قسم ومجموعها إن كانت ابتدائية وإن كانت إعدادية وثانوية الضارب) */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>إدارة المواد والمناهج الأكاديمية ({subjects.length} مادة)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تحديد مواد كل مرحلة وقسم، مع تحديد &quot;المجموع&quot; للابتدائي و&quot;الضارب/المعامل&quot; للإعدادي والثانوي
              </p>
            </div>

            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectNameAr('');
                setSubjectNameFr('');
                if (grades.length > 0) setSubjectGradeId(grades[0].id);
                setSubjectClassId('all');
                setSubjectCategory('arabic');
                setSubjectMaxScore(50);
                setSubjectCoefficient(2);
                setSubjectWeeklyHours(4);
                setShowAddSubject(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مادة دراسية جديدة</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">المرحلة / السنة:</label>
              <select
                value={subjectFilterGrade}
                onChange={(e) => setSubjectFilterGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white focus:outline-hidden"
              >
                <option value="all">كافة المراحل والسنوات</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.nameAr} ({g.nameFr})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">التصنيف الأكاديمي:</label>
              <select
                value={subjectFilterCategory}
                onChange={(e) => setSubjectFilterCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white focus:outline-hidden"
              >
                <option value="all">كافة التصنيفات</option>
                <option value="arabic">اللغة العربية وآدابها</option>
                <option value="french">اللغة الفرنسية</option>
                <option value="islamic">العلوم والتربية الإسلامية</option>
                <option value="scientific">المواد العلمية (رياضيات، علوم، فيزياء)</option>
                <option value="social">المواد الاجتماعية (تاريخ، جغرافيا، مدنية)</option>
                <option value="other">مواد أخرى (إنجليزية، فنون، رياضة)</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="p-2 bg-blue-50/60 rounded-xl border border-blue-200/60 w-full text-[11px] text-blue-900 flex items-center justify-between">
                <span>المواد المعروضة:</span>
                <span className="font-mono font-bold text-blue-700">
                  {subjects.filter(s => {
                    if (subjectFilterGrade !== 'all' && s.gradeId !== subjectFilterGrade) return false;
                    if (subjectFilterCategory !== 'all' && s.category !== subjectFilterCategory) return false;
                    return true;
                  }).length} مادة
                </span>
              </div>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">اسم المادة</th>
                    <th className="py-3 px-4">التصنيف</th>
                    <th className="py-3 px-4">المرحلة الدراسية</th>
                    <th className="py-3 px-4">القسم / الفصل</th>
                    <th className="py-3 px-4 text-center">التقييم (المجموع أو الضارب)</th>
                    <th className="py-3 px-4 text-center">الحصص الأسبوعية</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects
                    .filter(s => {
                      if (subjectFilterGrade !== 'all' && s.gradeId !== subjectFilterGrade) return false;
                      if (subjectFilterCategory !== 'all' && s.category !== subjectFilterCategory) return false;
                      return true;
                    })
                    .map(sbj => {
                      const grade = grades.find(g => g.id === sbj.gradeId);
                      const isPrimary = grade?.stage === 'primary' || grade?.stage === 'preschool' || institutionId === 'institut';
                      const cls = sbj.classId ? classes.find(c => c.id === sbj.classId) : null;

                      let catBadge = (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                          عام
                        </span>
                      );
                      if (sbj.category === 'arabic') {
                        catBadge = <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">عربية</span>;
                      } else if (sbj.category === 'french') {
                        catBadge = <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">فرنسية</span>;
                      } else if (sbj.category === 'islamic') {
                        catBadge = <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">إسلامية</span>;
                      } else if (sbj.category === 'scientific') {
                        catBadge = <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">علمية</span>;
                      } else if (sbj.category === 'social') {
                        catBadge = <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">اجتماعية</span>;
                      }

                      return (
                        <tr key={sbj.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{sbj.nameAr}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{sbj.nameFr}</div>
                          </td>
                          <td className="py-3 px-4">{catBadge}</td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">{grade?.nameAr || '—'}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {cls ? (
                              <span className="font-semibold text-blue-700">{cls.nameAr}</span>
                            ) : (
                              <span className="text-slate-400">كافة فصول السنة</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isPrimary ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold font-mono">
                                <Award className="w-3 h-3 text-emerald-600" />
                                <span>المجموع: {sbj.maxScore ?? 50}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold font-mono">
                                <Sliders className="w-3 h-3 text-purple-600" />
                                <span>الضارب: ×{sbj.coefficient ?? 2}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                            {sbj.weeklyHours} س/أ
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditSubject(sbj)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="تعديل المادة"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(sbj.id, sbj.nameAr)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف المادة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* TAB 4: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                جدول الحصص الأسبوعي (مرتكز على الفصل والأستاذ والمادة والوقت حصراً)
              </h3>
              <p className="text-[11px] text-slate-400">
                تحقق آلي من التعارضات لمنع إسناد حصتين للأستاذ نفسه في نفس الوقت
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>طباعة الجدول</span>
              </button>
              <button
                onClick={() => setShowAddSlot(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حصة للجدول</span>
              </button>
            </div>
          </div>

          {/* Timetable Grid View */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {daysOfWeek.map((dayName, dayIndex) => {
                const daySlots = timetable.filter(s => s.dayOfWeek === dayIndex);
                return (
                  <div key={dayName} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col">
                    <div className="font-bold text-xs text-slate-800 pb-2 mb-2 border-b border-slate-200 text-center">
                      {dayName}
                    </div>

                    <div className="space-y-2 flex-1">
                      {daySlots.length > 0 ? (
                        daySlots.map(slot => {
                          const cls = classes.find(c => c.id === slot.classId);
                          const sbj = subjects.find(s => s.id === slot.subjectId);
                          const tch = teachers.find(t => t.id === slot.teacherId);
                          return (
                            <div key={slot.id} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>{slot.startTime} - {slot.endTime}</span>
                                <span className="font-bold text-blue-600">{cls?.nameAr}</span>
                              </div>
                              <div className="font-bold text-slate-900">{sbj?.nameAr || 'مادة دراسية'}</div>
                              <div className="text-[11px] text-slate-500">{tch?.nameAr || 'الأستاذ'}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-[11px] text-slate-400">
                          لا توجد حصص
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Grade */}
      {showAddGrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">إضافة مرحلة / سنة دراسية</h4>
              <button onClick={() => setShowAddGrade(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المرحلة/السنة (بالعربية) *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: السنة الأولى ابتدائية"
                  value={gradeNameAr}
                  onChange={(e) => setGradeNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم أو الرمز الفرنسي (مفتوح يحدده المدير):</label>
                <input
                  type="text"
                  placeholder="مثال: 1AS أو 1ère Année"
                  value={gradeNameFr}
                  onChange={(e) => setGradeNameFr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المرحلة الدراسية *:</label>
                <select
                  value={gradeStage}
                  onChange={(e) => setGradeStage(e.target.value as Grade['stage'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {institutionId === 'institut' ? (
                    <option value="primary">المرحلة الابتدائية (السنوات 1 إلى 4 فقط)</option>
                  ) : (
                    <>
                      <option value="preschool">المرحلة ما قبل الابتدائية (الروضة والتمهيدي)</option>
                      <option value="primary">المرحلة الابتدائية (السنوات 1 إلى 6)</option>
                      <option value="middle">المرحلة الإعدادية (السنوات 1 إلى 4)</option>
                      <option value="secondary">المرحلة الثانوية (السنوات 5 إلى 7)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الترتيب الرقمي (1، 2، 3...):</label>
                <input
                  type="number"
                  min="1"
                  max={institutionId === 'institut' ? 4 : 12}
                  required
                  value={gradeOrder}
                  onChange={(e) => setGradeOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
                {institutionId === 'institut' && (
                  <p className="text-[10px] text-emerald-700 mt-1">
                    * في المعهد: مسموح من 1 إلى 4 فقط للمرحلة الابتدائية.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGrade(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  حفظ المرحلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Class (Exact 1:1 Replica of Uploaded Screenshot) */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Title with Blue Building/Store Icon */}
            <div className="flex items-center justify-center gap-2.5 pb-2">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>إضافة قسم دراسي جديد</span>
                <span className="p-1 rounded-lg bg-blue-50 text-blue-700">
                  <School className="w-5 h-5 text-blue-700" />
                </span>
              </h3>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              {/* Field 1: Stage Select with floating style */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 text-right">
                  المرحلة الدراسية *
                </label>
                <div className="relative">
                  <select
                    value={classGradeId}
                    onChange={(e) => setClassGradeId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 hover:border-blue-400 focus:border-blue-600 rounded-2xl bg-white text-slate-800 font-bold text-xs appearance-none pr-10 pl-8 transition-colors outline-hidden shadow-2xs"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.nameAr} ({g.nameFr})</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Field 2: Class Name (Arabic) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 text-right">
                  اسم القسم الدراسي *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="مثال: السنة الأولى - أ"
                    value={classNameAr}
                    onChange={(e) => setClassNameAr(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 hover:border-blue-400 focus:border-blue-600 rounded-2xl text-slate-900 font-bold text-xs pr-10 transition-colors outline-hidden shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Field 3: Class Name (French) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 text-right">
                  اسم القسم بالفرنسية
                </label>
                <input
                  type="text"
                  placeholder="Nom de la classe (ex: 1AF-A)"
                  value={classNameFr}
                  onChange={(e) => setClassNameFr(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 hover:border-blue-400 focus:border-blue-600 rounded-2xl text-slate-800 font-semibold text-xs transition-colors outline-hidden shadow-2xs text-left"
                  dir="ltr"
                />
              </div>

              {/* Field 4: Capacity */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 text-right">
                  الطاقة الاستيعابية للقسم *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="60"
                    required
                    value={classCapacity}
                    onChange={(e) => setClassCapacity(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 hover:border-blue-400 focus:border-blue-600 rounded-2xl text-slate-900 font-black font-mono text-sm pr-10 transition-colors outline-hidden shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
                    <School className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10.5px] text-slate-400 block text-right">
                  أقصى عدد من التلاميذ يمكن تسجيلهم في هذا القسم.
                </span>
              </div>

              {/* Nested Box: Default Fees for Class (Exact from Screenshot) */}
              <div className="bg-[#f0f6ff]/80 p-4 rounded-2xl border border-blue-100/90 space-y-2.5">
                <h5 className="font-bold text-xs text-blue-800 text-right">
                  الرسوم المدرسية الافتراضية للقسم:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Monthly Fee */}
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1 text-right">
                      الرسوم الشهرية (MRU)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={classMonthlyFee}
                      onChange={(e) => setClassMonthlyFee(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white text-slate-900 font-mono font-bold text-xs shadow-2xs"
                    />
                  </div>
                  {/* Registration Fee */}
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1 text-right">
                      رسوم التسجيل (MRU)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={classRegFee}
                      onChange={(e) => setClassRegFee(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white text-slate-900 font-mono font-bold text-xs shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons (حفظ blue button + إلغاء blue text) */}
              <div className="flex items-center justify-start gap-4 pt-3">
                <button
                  type="submit"
                  className="px-8 py-2.5 font-bold text-white bg-[#1e40af] hover:bg-blue-800 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer text-xs"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-4 py-2 font-bold text-blue-600 hover:text-blue-800 rounded-2xl transition-colors text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Timetable Slot */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">جدولة حصة دراسية جديدة</h4>
              <button onClick={() => setShowAddSlot(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الفصل الدراسي *:</label>
                <select
                  value={slotClassId}
                  onChange={(e) => setSlotClassId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="">-- حدد الفصل --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المادة الدراسية *:</label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="">-- حدد المادة --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الأستاذ المكلّف *:</label>
                <select
                  value={slotTeacherId}
                  onChange={(e) => setSlotTeacherId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="">-- حدد الأستاذ --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.nameAr} ({t.specialty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اليوم *:</label>
                <select
                  value={slotDay}
                  onChange={(e) => setSlotDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {daysOfWeek.map((d, idx) => (
                    <option key={d} value={idx}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت البدء:</label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت الانتهاء:</label>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSlot(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  جدولة الحصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Subject */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingSubject ? 'تعديل مادة دراسية' : 'إضافة مادة دراسية جديدة'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    تخصيص المادة للقسم أو السنة وتحديد معايير التقييم (المجموع أو الضارب)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddSubject(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Grade */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المرحلة الدراسية / السنة *:</label>
                  <select
                    value={subjectGradeId}
                    onChange={(e) => setSubjectGradeId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-blue-500 focus:outline-hidden"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.nameAr} ({g.nameFr})</option>
                    ))}
                  </select>
                </div>

                {/* Class */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم / الفصل المحدد:</label>
                  <select
                    value={subjectClassId}
                    onChange={(e) => setSubjectClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="all">كافة فصول هذه المرحلة</option>
                    {classes
                      .filter(c => !subjectGradeId || c.gradeId === subjectGradeId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.nameAr}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المادة (بالعربية) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الرياضيات، اللغة العربية..."
                    value={subjectNameAr}
                    onChange={(e) => setSubjectNameAr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المادة (بالفرنسية):</label>
                  <input
                    type="text"
                    placeholder="مثال: Mathématiques, Français..."
                    value={subjectNameFr}
                    onChange={(e) => setSubjectNameFr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">تصنيف المادة:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'arabic', label: 'لغة عربية' },
                    { key: 'french', label: 'لغة فرنسية' },
                    { key: 'islamic', label: 'علوم إسلامية' },
                    { key: 'scientific', label: 'مواد علمية' },
                    { key: 'social', label: 'مواد اجتماعية' },
                    { key: 'other', label: 'أخرى' }
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSubjectCategory(cat.key as Subject['category'])}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        subjectCategory === cat.key
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage-Aware: Max Score (المجموع) vs Coefficient (الضارب) */}
              {(() => {
                const currentGrade = grades.find(g => g.id === subjectGradeId);
                const isPrimary = currentGrade?.stage === 'primary' || currentGrade?.stage === 'preschool' || institutionId === 'institut';

                if (isPrimary) {
                  return (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-black text-emerald-900 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>المجموع (الدرجة القصوى للامتحان):</span>
                        </label>
                        <span className="font-mono font-black text-emerald-800 text-sm">/{subjectMaxScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[50, 30, 20, 10].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSubjectMaxScore(val)}
                            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                              subjectMaxScore === val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            /{val}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-800">
                        * المرحلة الابتدائية تعتمد نظام المجاميع (مثال: العربية والرياضيات /50، الفرنسية /30، الإسلامية والعلوم /20، المدنية /10).
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-black text-purple-900 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-purple-600" />
                          <span>الضارب الأكاديمي (المعامل / Coefficient):</span>
                        </label>
                        <span className="font-mono font-black text-purple-800 text-sm">×{subjectCoefficient}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 6].map(coef => (
                          <button
                            key={coef}
                            type="button"
                            onClick={() => setSubjectCoefficient(coef)}
                            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                              subjectCoefficient === coef
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                : 'bg-white text-purple-900 border-purple-300 hover:bg-purple-100'
                            }`}
                          >
                            ×{coef}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-purple-800">
                        * المرحلتان الإعدادية والثانوية تعتمدان نظام الضوارب (المعاملات) في احتساب المعدلات.
                      </p>
                    </div>
                  );
                }
              })()}

              {/* Weekly Hours and Teacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحصص الأسبوعية:</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={subjectWeeklyHours}
                    onChange={(e) => setSubjectWeeklyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المعلم / الأستاذ المكلف (اختياري):</label>
                  <select
                    value={subjectTeacherId}
                    onChange={(e) => setSubjectTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="">-- اختياري (غير محدد) --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.nameAr} ({t.specialty})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingSubject ? 'حفظ التعديلات' : 'إضافة المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
