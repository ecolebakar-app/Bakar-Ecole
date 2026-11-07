/**
 * Teachers & Staff Management Component for Ecole Bekar
 * Features:
 * - 3 Dedicated Categories / Tabs:
 *   1. الأساتذة (Professeurs - إعدادي وثانوي)
 *   2. المعلمون (Instituteurs - ابتدائي وأساسي)
 *   3. الموظفون والإداريون (Personnel Administratif et Technique)
 * - Clean Table & Grid views
 * - Modal matching the application UI standard
 * - Monthly salary slips generation and print preview
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Teacher } from '../../types';
import {
  Users,
  Plus,
  Printer,
  Search,
  BookOpen,
  DollarSign,
  Briefcase,
  GraduationCap,
  Building2,
  Phone,
  LayoutGrid,
  List,
  CheckCircle2,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { PrintPreviewModal } from '../layout/PrintPreviewModal';

type StaffTab = 'all' | 'professor' | 'teacher' | 'staff';

export const TeacherList: React.FC = () => {
  const { institutionId, currentInstitution, sectionId, showToast, refreshKey, reloadAll } = useApp();

  const [activeTab, setActiveTab] = useState<StaffTab>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [phone, setPhone] = useState('');
  const [roleCategory, setRoleCategory] = useState<'professor' | 'teacher' | 'staff'>('professor');
  const [specialty, setSpecialty] = useState('');
  const [contractType, setContractType] = useState<Teacher['contractType']>('monthly');
  const [baseSalary, setBaseSalary] = useState<number>(20000);
  const [hourlyRate, setHourlyRate] = useState<number>(350);
  const [weeklyTargetHours, setWeeklyTargetHours] = useState<number>(18);

  // Edit Teacher State
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editNameAr, setEditNameAr] = useState('');
  const [editNameFr, setEditNameFr] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleCategory, setEditRoleCategory] = useState<'professor' | 'teacher' | 'staff'>('professor');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editContractType, setEditContractType] = useState<Teacher['contractType']>('monthly');
  const [editBaseSalary, setEditBaseSalary] = useState<number>(20000);
  const [editHourlyRate, setEditHourlyRate] = useState<number>(350);
  const [editWeeklyTargetHours, setEditWeeklyTargetHours] = useState<number>(18);
  const [editStatus, setEditStatus] = useState<Teacher['status']>('active');

  const handleStartEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setEditNameAr(t.nameAr);
    setEditNameFr(t.nameFr || '');
    setEditPhone(t.phone);
    setEditRoleCategory(resolveRole(t));
    setEditSpecialty(t.specialty || '');
    setEditContractType(t.contractType);
    setEditBaseSalary(t.baseSalary || 20000);
    setEditHourlyRate(t.hourlyRate || 350);
    setEditWeeklyTargetHours(t.weeklyTargetHours || 18);
    setEditStatus(t.status || 'active');
  };

  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editNameAr.trim() || !editPhone.trim()) {
      showToast('يرجى إدخال الاسم ورقم الهاتف', 'error');
      return;
    }

    const updated: Teacher = {
      ...editingTeacher,
      nameAr: editNameAr.trim(),
      nameFr: editNameFr.trim() || editNameAr.trim(),
      phone: editPhone.trim(),
      roleCategory: editRoleCategory,
      specialty: editSpecialty.trim(),
      contractType: editContractType,
      baseSalary: editContractType === 'monthly' ? editBaseSalary : 0,
      hourlyRate: editContractType === 'hourly' ? editHourlyRate : undefined,
      weeklyTargetHours: editWeeklyTargetHours,
      status: editStatus
    };

    StorageEngine.saveTeacher(updated);

    StorageEngine.addAuditLog({
      institutionId,
      userId: 'current-user',
      userName: 'المسؤول الإداري',
      userRole: 'super_admin',
      action: 'update',
      module: 'teachers',
      recordId: updated.id,
      details: `تعديل بيانات ${editRoleCategory === 'staff' ? 'الموظف' : 'الأستاذ'}: ${updated.nameAr} (${updated.employeeNumber})`
    });

    showToast('تم حفظ التعديلات بنجاح ✓', 'success');
    setEditingTeacher(null);
    reloadAll();
  };

  // Selected for salary slip print preview
  const [selectedForSlip, setSelectedForSlip] = useState<Teacher | null>(null);

  const rawTeachers = useMemo(() => {
    return StorageEngine.getTeachers(institutionId, sectionId);
  }, [institutionId, sectionId, refreshKey]);

  // Helper to resolve roleCategory if missing in legacy records
  const resolveRole = (t: Teacher): 'professor' | 'teacher' | 'staff' => {
    if (t.roleCategory) return t.roleCategory;
    const spec = (t.specialty || '').toLowerCase();
    if (spec.includes('مدير') || spec.includes('إدار') || spec.includes('حارس') || spec.includes('محاسب') || spec.includes('سكرت')) {
      return 'staff';
    }
    if (spec.includes('ابتدائي') || spec.includes('معلم') || spec.includes('قرآن')) {
      return 'teacher';
    }
    return 'professor';
  };

  const counts = useMemo(() => {
    let professors = 0;
    let teachers = 0;
    let staff = 0;
    rawTeachers.forEach(t => {
      const r = resolveRole(t);
      if (r === 'professor') professors++;
      else if (r === 'teacher') teachers++;
      else if (r === 'staff') staff++;
    });
    return { all: rawTeachers.length, professor: professors, teacher: teachers, staff };
  }, [rawTeachers]);

  const filteredTeachers = useMemo(() => {
    return rawTeachers.filter(t => {
      const r = resolveRole(t);
      if (activeTab !== 'all' && r !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.nameAr.includes(q) || (t.nameFr && t.nameFr.toLowerCase().includes(q));
        const matchSpec = t.specialty && t.specialty.toLowerCase().includes(q);
        const matchPhone = t.phone && t.phone.includes(q);
        return matchName || matchSpec || matchPhone;
      }
      return true;
    });
  }, [rawTeachers, activeTab, searchQuery]);

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !phone.trim()) {
      showToast('يرجى إدخال الاسم ورقم الهاتف', 'error');
      return;
    }

    const prefix = roleCategory === 'staff' ? 'ADM' : roleCategory === 'teacher' ? 'INS' : 'PRF';
    const newMember: Teacher = {
      id: `tch-${Date.now()}`,
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      employeeNumber: `${prefix}-${institutionId === 'institut' ? 'I' : 'E'}-${String(rawTeachers.length + 1).padStart(3, '0')}`,
      nameAr,
      nameFr: nameFr || nameAr,
      phone,
      roleCategory,
      specialty: specialty.trim() || (roleCategory === 'staff' ? 'إداري' : 'عام'),
      qualification: 'مؤهل أكاديمي معتمد',
      hireDate: new Date().toISOString().split('T')[0],
      contractType,
      baseSalary: contractType === 'monthly' ? baseSalary : 0,
      hourlyRate: contractType === 'hourly' ? hourlyRate : undefined,
      weeklyTargetHours,
      status: 'active'
    };

    StorageEngine.saveTeacher(newMember);
    showToast('تمت إضافة العضو بنجاح إلى السجلات', 'success');
    setShowAddModal(false);
    setNameAr('');
    setNameFr('');
    setPhone('');
    setSpecialty('');
    reloadAll();
  };

  const getRoleBadge = (role: 'professor' | 'teacher' | 'staff') => {
    switch (role) {
      case 'professor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <GraduationCap className="w-3 h-3" />
            <span>أستاذ (إعدادي/ثانوي)</span>
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <BookOpen className="w-3 h-3" />
            <span>معلم (ابتدائي/أساسي)</span>
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Briefcase className="w-3 h-3" />
            <span>طاقم إداري وموظف</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>الكادر التربوي والإداري - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة الأساتذة، المعلمين، والموظفين الإداريين، وعقود الرواتب وساعات العمل
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عضو جديد للكادر</span>
        </button>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>الكل</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('professor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'professor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>الأساتذة (إعدادي وثانوي)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'professor' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
              {counts.professor}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'teacher'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>المعلمون (ابتدائي)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'teacher' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {counts.teacher}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'staff'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>الموظفون والإداريون</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'staff' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {counts.staff}
            </span>
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو التخصص أو الهاتف..."
              className="w-full pr-9 pl-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="عرض كجدول منظم"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="عرض كبطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">الرقم التعريفي</th>
                  <th className="py-3 px-4">الاسم الكامل (Ar / Fr)</th>
                  <th className="py-3 px-4">الفئة</th>
                  <th className="py-3 px-4">المادة / المسمى الوظيفي</th>
                  <th className="py-3 px-4">رقم الهاتف</th>
                  <th className="py-3 px-4">نظام التعاقد والأجر</th>
                  <th className="py-3 px-4">الساعات الأسبوعية</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      لا يوجد أعضاء يطابقون خيارات البحث أو التصفية الحالية
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(t => {
                    const r = resolveRole(t);
                    return (
                      <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">
                          {t.employeeNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{t.nameAr}</div>
                          {t.nameFr && <div className="text-[11px] text-slate-500 font-medium font-mono">{t.nameFr}</div>}
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(r)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {t.specialty || 'غير محدد'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800" dir="ltr">
                          {t.phone}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 font-mono">
                            {t.contractType === 'monthly'
                              ? `${t.baseSalary?.toLocaleString() || 0} MRU / شهر`
                              : `${t.hourlyRate || 0} MRU / ساعة`}
                          </div>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold mt-0.5 ${
                            t.contractType === 'monthly' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {t.contractType === 'monthly' ? 'راتب شهري مقطوع' : 'حسب الساعات المنجزة'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {t.weeklyTargetHours ? `${t.weeklyTargetHours} ساعة` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedForSlip(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>قسيمة الراتب</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map(t => {
            const r = resolveRole(t);
            return (
              <div key={t.id} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-4 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 flex items-center justify-center font-bold text-base border border-indigo-100/80 shadow-2xs group-hover:scale-105 transition-transform">
                      {t.nameAr.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-950 transition-colors">{t.nameAr}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">{t.employeeNumber}</p>
                    </div>
                  </div>
                  {getRoleBadge(r)}
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">التخصص / الوظيفة:</span>
                    <span className="font-bold text-slate-800">{t.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">الهاتف:</span>
                    <span className="font-mono text-slate-800" dir="ltr">{t.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">الساعات الأسبوعية:</span>
                    <span className="font-bold text-indigo-700 font-mono">{t.weeklyTargetHours} ساعة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">معدل التعويض:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {t.contractType === 'monthly' ? `${t.baseSalary.toLocaleString()} MRU شهرياً` : `${t.hourlyRate} MRU / ساعة`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedForSlip(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>قسيمة الراتب</span>
                  </button>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">نشط ✓</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Replicated Modal: Add Teacher / Staff Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">إضافة عضو جديد في الكادر</h3>
                  <p className="text-[11px] text-slate-400">سجل معلومات الأستاذ أو المعلم أو الموظف ونظام الراتب</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              {/* Role Category Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">فئة العمل / الرتبة *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleCategory('professor')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      roleCategory === 'professor'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    أستاذ (إعدادي/ثانوي)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleCategory('teacher')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      roleCategory === 'teacher'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    معلم (ابتدائي)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleCategory('staff')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      roleCategory === 'staff'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    موظف / إداري
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم الكامل (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الشيخ عبد الله ولد أحمد"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom Complet (فرنسي - اختياري)</label>
                  <input
                    type="text"
                    placeholder="Cheikh Abdallahi Ould Ahmed"
                    value={nameFr}
                    onChange={(e) => setNameFr(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-medium font-mono"
                  />
                </div>
              </div>

              {/* Phone & Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 41223344"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pr-10 pl-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المادة / التخصص أو الوظيفة *</label>
                  <input
                    type="text"
                    required
                    placeholder={roleCategory === 'staff' ? 'محاسب، أمين سر، مشرف...' : 'الرياضيات، اللغة العربية، العلوم...'}
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Nested Financial Card (matching the replica pattern) */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span>نظام التعاقد والرواتب المعتمد:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                      <input
                        type="radio"
                        checked={contractType === 'monthly'}
                        onChange={() => setContractType('monthly')}
                        className="text-indigo-600"
                      />
                      <span>راتب شهري مقطوع</span>
                    </label>
                    <label className="inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                      <input
                        type="radio"
                        checked={contractType === 'hourly'}
                        onChange={() => setContractType('hourly')}
                        className="text-indigo-600"
                      />
                      <span>بالساعات المنجزة</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {contractType === 'monthly' ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">الراتب الأساسي الشهري (MRU)</label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">سعر الساعة التدريسية (MRU)</label>
                      <input
                        type="number"
                        min="100"
                        step="25"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">الساعات الأسبوعية المستهدفة</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={weeklyTargetHours}
                      onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Print Preview Modal */}
      {selectedForSlip && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setSelectedForSlip(null)}
          title="قسيمة راتب شهرية"
          documentNumber={`SLIP-${selectedForSlip.employeeNumber}`}
        >
          <div className="space-y-6 text-slate-900 text-xs">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black">Ecole Bekar</h2>
                <h3 className="text-xs font-bold text-slate-700">{currentInstitution.nameAr}</h3>
                <p className="text-[10px] text-slate-500 font-mono">شهر: {new Date().toLocaleDateString('ar-MR', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="text-center">
                <span className="text-sm font-black px-3 py-1 bg-slate-900 text-white rounded-lg block">
                  قسيمة الراتب والأجر (BULLETIN DE PAIE)
                </span>
                <span className="text-[11px] font-mono text-slate-600 font-bold mt-1 block">
                  {selectedForSlip.employeeNumber}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 ml-1">الاسم:</span>
                <strong className="text-slate-900">{selectedForSlip.nameAr}</strong>
              </div>
              <div>
                <span className="text-slate-500 ml-1">المسمى / التخصص:</span>
                <strong>{selectedForSlip.specialty}</strong>
              </div>
              <div>
                <span className="text-slate-500 ml-1">نوع العقد:</span>
                <strong>{selectedForSlip.contractType === 'monthly' ? 'راتب شهري مقطوع' : 'بالساعات المنجزة'}</strong>
              </div>
              <div>
                <span className="text-slate-500 ml-1">الساعات المستهدفة:</span>
                <strong className="font-mono">{selectedForSlip.weeklyTargetHours} ساعة/أسبوعياً</strong>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="p-2 border border-slate-300 text-right">بيان الأجر والاستقطاع</th>
                  <th className="p-2 border border-slate-300 text-left w-36 font-mono">المبلغ (MRU)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-200">الراتب الأساسي / مستحقات الساعات المنجزة</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold text-emerald-700 text-left">
                    {selectedForSlip.contractType === 'monthly' ? selectedForSlip.baseSalary.toLocaleString() : ((selectedForSlip.hourlyRate || 350) * selectedForSlip.weeklyTargetHours * 4).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200">علاوة التدريس والانضباط والأداء</td>
                  <td className="p-2 border border-slate-200 font-mono text-emerald-700 text-left">0</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200">استقطاع سلفة أو غياب (إن وُجد)</td>
                  <td className="p-2 border border-slate-200 font-mono text-rose-600 text-left">0</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td className="p-2.5 border border-slate-300">صافي الراتب المستحق:</td>
                  <td className="p-2.5 border border-slate-300 font-mono font-black text-sm text-slate-900 text-left">
                    {selectedForSlip.contractType === 'monthly' ? selectedForSlip.baseSalary.toLocaleString() : ((selectedForSlip.hourlyRate || 350) * selectedForSlip.weeklyTargetHours * 4).toLocaleString()} MRU
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-600">
              <div>
                <span className="font-bold block mb-12">توقيع المستلم</span>
                <span className="border-t border-slate-300 pt-1 block">{selectedForSlip.nameAr}</span>
              </div>
              <div>
                <span className="font-bold block mb-12">اعتماد المحاسب وإدارة مجمع مدارس بكار الحرة</span>
                <span className="border-t border-slate-300 pt-1 block">إدارة الشؤون المالية</span>
              </div>
            </div>
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
