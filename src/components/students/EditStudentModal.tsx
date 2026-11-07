/**
 * Edit Student Modal Component
 * Conforms to the standard modal design from the reference screenshot:
 * - Rounded-3xl container with blue icon header
 * - Edit all student fields: names (Ar/Fr), NNI, phone, birth date/place, gender, status, class, fees
 * - Synchronizes with StorageEngine.updateStudent and logs audit entry
 */

import React, { useState } from 'react';
import { Student } from '../../types';
import { StorageEngine } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  X,
  User,
  Phone,
  Calendar,
  Building2,
  DollarSign,
  Save,
  ShieldAlert
} from 'lucide-react';

interface EditStudentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { institutionId, showToast, reloadAll } = useApp();

  // Form State
  const [firstNameAr, setFirstNameAr] = useState(student.firstNameAr);
  const [lastNameAr, setLastNameAr] = useState(student.lastNameAr);
  const [firstNameFr, setFirstNameFr] = useState(student.firstNameFr);
  const [lastNameFr, setLastNameFr] = useState(student.lastNameFr);
  const [nationalId, setNationalId] = useState(student.nationalId || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [birthDate, setBirthDate] = useState(student.birthDate);
  const [birthPlace, setBirthPlace] = useState(student.birthPlace);
  const [gender, setGender] = useState<Student['gender']>(student.gender);
  const [gradeId, setGradeId] = useState(student.gradeId);
  const [classId, setClassId] = useState(student.classId);
  const [status, setStatus] = useState<Student['status']>(student.status);
  const [exemptionType, setExemptionType] = useState<Student['exemptionType']>(student.exemptionType);
  const [customMonthlyFee, setCustomMonthlyFee] = useState<number>(student.customMonthlyFee || 0);

  const grades = StorageEngine.getGrades(institutionId);
  const classes = StorageEngine.getClasses(institutionId).filter(c => c.gradeId === gradeId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstNameAr.trim() || !lastNameAr.trim()) {
      showToast('يرجى إدخال اسم التلميذ بالعربية', 'error');
      return;
    }

    const updatedStudent: Student = {
      ...student,
      firstNameAr: firstNameAr.trim(),
      lastNameAr: lastNameAr.trim(),
      firstNameFr: firstNameFr.trim() || firstNameAr.trim(),
      lastNameFr: lastNameFr.trim() || lastNameAr.trim(),
      nationalId: nationalId.trim() || undefined,
      phone: phone.trim() || undefined,
      birthDate,
      birthPlace: birthPlace.trim(),
      gender,
      gradeId,
      classId,
      status,
      exemptionType,
      customMonthlyFee: customMonthlyFee > 0 ? customMonthlyFee : undefined,
      updatedAt: new Date().toISOString()
    };

    StorageEngine.updateStudent(updatedStudent);

    StorageEngine.addAuditLog({
      institutionId,
      userId: 'current-user',
      userName: 'المسؤول الإداري',
      userRole: 'super_admin',
      action: 'update',
      module: 'students',
      recordId: student.id,
      details: `تعديل بيانات التلميذ: ${updatedStudent.firstNameAr} ${updatedStudent.lastNameAr} (${updatedStudent.registrationNumber})`
    });

    showToast('تم تحديث بيانات التلميذ بنجاح', 'success');
    reloadAll();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header matching screenshot design */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تعديل بيانات التلميذ</h3>
              <p className="text-[11px] text-slate-400 font-mono">رقم القيد: {student.registrationNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Arabic Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الاسم الأول (بالعربية) *</label>
              <input
                type="text"
                required
                value={firstNameAr}
                onChange={(e) => setFirstNameAr(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">اللقب / اسم العائلة (بالعربية) *</label>
              <input
                type="text"
                required
                value={lastNameAr}
                onChange={(e) => setLastNameAr(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* French Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Prénom (Français)</label>
              <input
                type="text"
                value={firstNameFr}
                onChange={(e) => setFirstNameFr(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom de famille (Français)</label>
              <input
                type="text"
                value={lastNameFr}
                onChange={(e) => setLastNameFr(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* NNI & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الرقم الوطني للتعريف (NNI)</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="10 أرقام"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم هاتف للتواصل</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="41223344"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Birth Date & Place */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">تاريخ الميلاد</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">مكان الميلاد</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">الجنس</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>

          {/* Academic Placement */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المرحلة الدراسية</label>
              <select
                value={gradeId}
                onChange={(e) => {
                  setGradeId(e.target.value);
                  const newClasses = StorageEngine.getClasses(institutionId).filter(c => c.gradeId === e.target.value);
                  if (newClasses[0]) setClassId(newClasses[0].id);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.nameAr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">القسم / الفصل</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nameAr} ({c.nameFr})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الحالة الأكاديمية</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
              >
                <option value="active">نشط ومسجل</option>
                <option value="suspended">موقوف مؤقتاً</option>
                <option value="transferred">محول لمؤسسة أخرى</option>
                <option value="graduated">متخرج</option>
              </select>
            </div>
          </div>

          {/* Financial Override Box */}
          <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>إعدادات الرسوم والخصم المعتمدة:</span>
              </span>
              <span className="text-[10px] text-slate-400">خاص بهذا التلميذ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">نوع الإعفاء / الخصم</label>
                <select
                  value={exemptionType}
                  onChange={(e) => setExemptionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-xs"
                >
                  <option value="none">عادي (بدون إعفاء)</option>
                  <option value="brother_discount">خصم إخوة</option>
                  <option value="partial">إعفاء جزئي</option>
                  <option value="full">إعفاء كامل (100%)</option>
                  <option value="scholarship">منحة دراسية</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">قسط شهري مخصص (MRU)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={customMonthlyFee}
                  onChange={(e) => setCustomMonthlyFee(Number(e.target.value))}
                  placeholder="اتركه 0 لاستخدام رسم المرحلة"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
