/**
 * Student Behavior & Discipline View (السلوك والأخلاق والملاحظات)
 * Features:
 * - Positive commendations & discipline tracking
 * - Categories: Attendance, Homework, Conduct, Achievement
 * - Guardian notification toggle
 * - Filter by student and class
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { StudentBehaviorRecord } from '../../types';
import {
  HeartHandshake,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  Bell,
  X,
  Save,
  Printer
} from 'lucide-react';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';

export const BehaviorNotesView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const students = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId]);
  const behaviorRecords = useMemo(() => StorageEngine.getBehaviorRecords(institutionId), [institutionId, isAddModalOpen]);

  // Form State for new note
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [noteType, setNoteType] = useState<StudentBehaviorRecord['type']>('positive');
  const [category, setCategory] = useState<StudentBehaviorRecord['category']>('achievement');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [guardianNotified, setGuardianNotified] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      showToast('يرجى اختيار التلميذ', 'error');
      return;
    }

    const stuClass = classes.find(c => c.id === student.classId);

    const newRecord: StudentBehaviorRecord = {
      id: `bhv-${Date.now()}`,
      institutionId,
      sectionId: student.sectionId,
      studentId: student.id,
      studentName: `${student.firstNameAr} ${student.lastNameAr}`,
      classId: student.classId,
      className: stuClass?.nameAr || '—',
      date: new Date().toISOString().split('T')[0],
      type: noteType,
      category,
      title,
      description,
      actionTaken: actionTaken || undefined,
      guardianNotified,
      recordedBy: 'المرشد التربوي'
    };

    StorageEngine.saveBehaviorRecord(newRecord);
    showToast('تم تسجيل الملاحظة السلوكية بنجاح', 'success');
    setIsAddModalOpen(false);

    // Reset
    setTitle('');
    setDescription('');
    setActionTaken('');
    setGuardianNotified(false);
  };

  const filteredRecords = useMemo(() => {
    return behaviorRecords.filter(r => {
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = r.studentName.includes(q) || r.title.includes(q) || r.description.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [behaviorRecords, filterType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              التوجيه والإرشاد التربوي
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">سجل الانضباط</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>السلوك والأخلاق والملاحظات التربوية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة السلوك اليومي، الإشادات والتشجيع، التنبيهات الإدارية، وإشعار أولياء الأمور
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة السجل</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة ملاحظة سلوكية</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم التلميذ أو نص الملاحظة..."
            className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">كل أنواع الملاحظات</option>
            <option value="positive">إشادة وتشجيع (إيجابي)</option>
            <option value="commendation">تكريم وتميز</option>
            <option value="warning">تنبيه سلوكي</option>
            <option value="infraction">مخالفة انضباطية</option>
          </select>
        </div>
      </div>

      {/* Organized Behavior Notes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">التلميذ / القسم</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4 text-center">النوع</th>
                <th className="py-3 px-4">العنوان والتفاصيل</th>
                <th className="py-3 px-4">الإجراء المتخذ</th>
                <th className="py-3 px-4 text-center">إشعار الوكيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-center">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.studentName}</div>
                      <div className="text-[11px] text-slate-400">{rec.className}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{rec.date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rec.type === 'positive' || rec.type === 'commendation'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {rec.type === 'positive' ? 'إشادة وتشجيع' :
                         rec.type === 'commendation' ? 'تميز وتكريم' :
                         rec.type === 'warning' ? 'تنبيه سلوكي' : 'مخالفة'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-800">{rec.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{rec.description}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      {rec.actionTaken || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rec.guardianNotified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          <span>تم الإشعار</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">لم يُشعر</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    لا توجد ملاحظات سلوكية مسجلة حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">تسجيل ملاحظة سلوكية جديدة</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختيار التلميذ *:</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">-- اختر التلميذ --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstNameAr} {s.lastNameAr} ({s.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الملاحظة:</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="positive">إشادة وتشجيع</option>
                    <option value="commendation">تكريم وتميز</option>
                    <option value="warning">تنبيه سلوكي</option>
                    <option value="infraction">مخالفة انضباطية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المجال:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="achievement">تميز أكاديمي وإنجاز</option>
                    <option value="discipline">انضباط والتزام</option>
                    <option value="respect">أخلاق واحترام الزملاء</option>
                    <option value="homework">واجبات ومذاكرة</option>
                    <option value="attendance">حضور والتزام بالمواعيد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الملاحظة *:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تفوق ملحوظ في مسابقة حفظ القرآن الكريم..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التفاصيل *:</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل الملاحظة السلوكية أو الواقعة..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الإجراء المتخذ (اختياري):</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="مثال: منح شهادة تقدير / توجيه شفهي..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="notifyGuardian"
                  checked={guardianNotified}
                  onChange={(e) => setGuardianNotified(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <label htmlFor="notifyGuardian" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  إشعار ولي الأمر (الوكيل) عبر مركز الإشعارات / الواتساب
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  حفظ الملاحظة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Report Modal */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setShowPrintModal(false)}
          title="تقرير الملاحظات السلوكية والانضباط المدرسي"
        >
          <div className="bg-white text-black p-4 font-sans max-w-[210mm] mx-auto text-xs" dir="rtl">
            <div className="w-full pb-2 mb-3 border-b-2 border-[#1e1b4b]">
              <img
                src="/assets/aistudio/__________2026-10-22_161815_d10b3316.png"
                alt="ترويسة مجمع مدارس بكار الحرة"
                className="w-full max-h-20 object-contain mx-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-center mb-4">
              <h3 className="text-base font-black text-slate-900">
                سجل الملاحظات السلوكية والانضباط المدرسي
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                تاريخ الاستخراج: {new Date().toISOString().split('T')[0]} · العدد الإجمالي: {filteredRecords.length} ملاحظة
              </p>
            </div>
            <table className="w-full text-xs text-right border-collapse border border-black mb-6">
              <thead className="bg-slate-200 font-bold border-b border-black">
                <tr>
                  <th className="p-1.5 border border-black text-center w-10">#</th>
                  <th className="p-1.5 border border-black">التلميذ</th>
                  <th className="p-1.5 border border-black text-center w-24">القسم</th>
                  <th className="p-1.5 border border-black text-center font-mono w-24">التاريخ</th>
                  <th className="p-1.5 border border-black text-center w-24">النوع</th>
                  <th className="p-1.5 border border-black">العنوان والتفاصيل</th>
                  <th className="p-1.5 border border-black">الإجراء المتخذ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, i) => (
                  <tr key={rec.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-1.5 border border-black text-center font-mono">{i + 1}</td>
                    <td className="p-1.5 border border-black font-bold">{rec.studentName}</td>
                    <td className="p-1.5 border border-black text-center">{rec.className}</td>
                    <td className="p-1.5 border border-black text-center font-mono">{rec.date}</td>
                    <td className="p-1.5 border border-black text-center font-bold">
                      {rec.type === 'positive' ? 'إشادة' : rec.type === 'commendation' ? 'تكريم' : rec.type === 'warning' ? 'تنبيه' : 'مخالفة'}
                    </td>
                    <td className="p-1.5 border border-black">
                      <span className="font-bold block">{rec.title}</span>
                      <span className="text-[10.5px] text-slate-700">{rec.description}</span>
                    </td>
                    <td className="p-1.5 border border-black text-[10.5px]">{rec.actionTaken || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-8 text-center text-xs font-bold pt-4 border-t border-black">
              <div>
                <span>المرشد التربوي</span>
                <div className="h-12 mt-1"></div>
              </div>
              <div>
                <span>المدير العام والختم</span>
                <div className="h-12 mt-1"></div>
              </div>
            </div>
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
