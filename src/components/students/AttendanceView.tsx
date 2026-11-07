/**
 * Student Daily Attendance View (الحضور والغياب)
 * Features:
 * - One-click "تحديد الجميع حاضرين" action
 * - Class & Grade filter
 * - Status toggle (حاضر / غائب / متأخر / معذور) with excuse note attachments
 * - Real-time attendance rate calculation
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { AttendanceRecord } from '../../types';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCheck,
  Save,
  Search,
  Filter,
  FileCheck,
  Printer
} from 'lucide-react';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';

export const AttendanceView: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, showToast } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const classes = useMemo(() => StorageEngine.getClasses(institutionId, sectionId), [institutionId, sectionId]);
  const students = useMemo(() => StorageEngine.getStudents(institutionId, sectionId), [institutionId, sectionId]);
  const existingAttendance = useMemo(() => StorageEngine.getAttendance(institutionId, undefined, selectedDate), [institutionId, selectedDate]);

  // Attendance state map for the current screen
  const [attendanceMap, setAttendanceMap] = useState<Record<string, {
    status: 'present' | 'absent' | 'late' | 'excused';
    notes: string;
  }>>({});

  // Sync state map when date or students change
  React.useEffect(() => {
    const nextMap: typeof attendanceMap = {};
    students.forEach(s => {
      const rec = existingAttendance.find(a => a.studentId === s.id);
      if (rec) {
        nextMap[s.id] = { status: rec.status, notes: rec.notes || '' };
      } else {
        nextMap[s.id] = { status: 'present', notes: '' };
      }
    });
    setAttendanceMap(nextMap);
  }, [students, existingAttendance, selectedDate]);

  // Bulk mark all present
  const handleMarkAllPresent = () => {
    const nextMap = { ...attendanceMap };
    students.forEach(s => {
      if (selectedClassId === 'all' || s.classId === selectedClassId) {
        nextMap[s.id] = { status: 'present', notes: '' };
      }
    });
    setAttendanceMap(nextMap);
    showToast('تم تحديد جميع التلاميذ كحاضرين بنجاح ✓', 'success');
  };

  const handleSaveAll = () => {
    const recordsToSave: AttendanceRecord[] = [];
    students.forEach(s => {
      if (selectedClassId === 'all' || s.classId === selectedClassId) {
        const item = attendanceMap[s.id] || { status: 'present', notes: '' };
        recordsToSave.push({
          id: `att-${s.id}-${selectedDate}`,
          institutionId,
          sectionId: s.sectionId,
          academicYearId: s.academicYearId,
          classId: s.classId,
          studentId: s.id,
          date: selectedDate,
          status: item.status,
          notes: item.notes || undefined
        });
      }
    });

    StorageEngine.saveAttendance(recordsToSave);
    showToast(`تم حفظ سجل الحضور والغياب لتاريخ ${selectedDate} بنجاح ✓`, 'success');
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = s.firstNameAr.includes(q) || s.lastNameAr.includes(q) ||
          s.registrationNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [students, selectedClassId, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    filteredStudents.forEach(s => {
      const item = attendanceMap[s.id]?.status || 'present';
      if (item === 'present') present++;
      else if (item === 'absent') absent++;
      else if (item === 'late') late++;
      else if (item === 'excused') excused++;
    });

    const total = filteredStudents.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, absent, late, excused, total, rate };
  }, [filteredStudents, attendanceMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              الانضباط المدرسي اليومي
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">{selectedDate}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>الحضور والغياب اليومي (Présence & Absence)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            رصد حضور التلاميذ، وتسجيل الإعفاءات والمبررات مع زر "تحديد الجميع حاضرين" بضغطة واحدة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة القائمة</span>
          </button>
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>تحديد الجميع حاضرين</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الحضور</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">نسبة الحضور</span>
          <div className="text-2xl font-black font-mono text-emerald-600">{stats.rate}%</div>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">عدد الحاضرين</span>
          <div className="text-2xl font-black font-mono text-slate-900">{stats.present}</div>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">عدد الغائبين</span>
          <div className="text-2xl font-black font-mono text-rose-600">{stats.absent}</div>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">المعذورين / المتأخرين</span>
          <div className="text-2xl font-black font-mono text-amber-600">{stats.excused + stats.late}</div>
        </div>
      </div>

      {/* Date & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الحصة:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">اختيار الفصل:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">كل الفصول ({students.length} تلميذ)</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.nameAr} ({c.nameFr})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">بحث سريع:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم التلميذ..."
              className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Students Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">الرقم</th>
                <th className="py-3 px-4">اسم التلميذ</th>
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4 text-center">حالة الحضور</th>
                <th className="py-3 px-4">المبرر / ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student, idx) => {
                const stuClass = classes.find(c => c.id === student.classId);
                const current = attendanceMap[student.id] || { status: 'present', notes: '' };

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{student.firstNameAr} {student.lastNameAr}</td>
                    <td className="py-3 px-4 text-slate-600">{stuClass?.nameAr || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        {(['present', 'late', 'excused', 'absent'] as const).map(st => {
                          const isSel = current.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setAttendanceMap(prev => ({
                                  ...prev,
                                  [student.id]: { ...current, status: st }
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                isSel
                                  ? st === 'present' ? 'bg-emerald-600 text-white shadow-2xs' :
                                    st === 'absent' ? 'bg-rose-600 text-white shadow-2xs' :
                                    st === 'late' ? 'bg-amber-600 text-white shadow-2xs' :
                                    'bg-blue-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st === 'present' ? 'حاضر' :
                               st === 'absent' ? 'غائب' :
                               st === 'late' ? 'متأخر' : 'معذور'}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={current.notes}
                        onChange={(e) => {
                          setAttendanceMap(prev => ({
                            ...prev,
                            [student.id]: { ...current, notes: e.target.value }
                          }));
                        }}
                        placeholder="سبب الغياب أو الإذن الطبي..."
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Daily Attendance Sheet Print Preview */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setShowPrintModal(false)}
          title={`تقرير الحضور والغياب اليومي - ${selectedDate}`}
        >
          <div className="bg-white text-black p-4 font-sans max-w-[210mm] mx-auto text-xs" dir="rtl">
            {/* Header Banner */}
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

            {/* Title */}
            <div className="text-center mb-4">
              <h3 className="text-base font-black text-slate-900">
                سجل الحضور والغياب اليومي (Feuille d'Appel Journalière)
              </h3>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-600 font-bold mt-1">
                <span>التاريخ: {selectedDate}</span>
                <span>·</span>
                <span>القسم: {selectedClassId === 'all' ? 'كافة الفصول' : classes.find(c => c.id === selectedClassId)?.nameAr}</span>
                <span>·</span>
                <span>نسبة الحضور: {stats.rate}%</span>
              </div>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-4 gap-2 text-center mb-4 text-xs font-bold">
              <div className="p-2 border border-slate-300 rounded-lg bg-slate-50">
                <span className="text-slate-500 block text-[10px]">إجمالي التلاميذ</span>
                <span className="font-mono text-base">{filteredStudents.length}</span>
              </div>
              <div className="p-2 border border-emerald-300 rounded-lg bg-emerald-50 text-emerald-900">
                <span className="text-emerald-700 block text-[10px]">الحاضرون</span>
                <span className="font-mono text-base">{stats.present}</span>
              </div>
              <div className="p-2 border border-rose-300 rounded-lg bg-rose-50 text-rose-900">
                <span className="text-rose-700 block text-[10px]">الغائبون</span>
                <span className="font-mono text-base">{stats.absent}</span>
              </div>
              <div className="p-2 border border-amber-300 rounded-lg bg-amber-50 text-amber-900">
                <span className="text-amber-700 block text-[10px]">المعذورون / المتأخرون</span>
                <span className="font-mono text-base">{stats.excused + stats.late}</span>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-right border-collapse border border-black mb-6">
              <thead className="bg-slate-200 text-black font-bold border-b border-black">
                <tr>
                  <th className="p-1.5 border border-black text-center w-10">#</th>
                  <th className="p-1.5 border border-black">اسم التلميذ</th>
                  <th className="p-1.5 border border-black text-center w-28">القسم</th>
                  <th className="p-1.5 border border-black text-center w-24">الحالة</th>
                  <th className="p-1.5 border border-black">الملاحظات والمبررات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((stu, i) => {
                  const item = attendanceMap[stu.id] || { status: 'present', notes: '' };
                  const cls = classes.find(c => c.id === stu.classId);
                  return (
                    <tr key={stu.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border border-black text-center font-mono">{i + 1}</td>
                      <td className="p-1.5 border border-black font-bold">{stu.firstNameAr} {stu.lastNameAr}</td>
                      <td className="p-1.5 border border-black text-center">{cls?.nameAr || '—'}</td>
                      <td className={`p-1.5 border border-black text-center font-bold ${
                        item.status === 'present' ? 'text-emerald-700' :
                        item.status === 'absent' ? 'text-rose-700' :
                        item.status === 'late' ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        {item.status === 'present' ? 'حاضر' :
                         item.status === 'absent' ? 'غائب' :
                         item.status === 'late' ? 'متأخر' : 'معذور'}
                      </td>
                      <td className="p-1.5 border border-black text-[10.5px]">{item.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs font-bold pt-4 border-t border-black">
              <div>
                <span>مراقب القسم / الأستاذ</span>
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
