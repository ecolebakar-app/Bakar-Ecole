/**
 * Unified Settings & Administration View for Ecole Bekar
 * Conforms to Executive Specification & User Requirements:
 * - Tab 1: إعداد الرسوم الدراسية (Unified Fee Setup per grade)
 * - Tab 2: بيانات المؤسسة (Institution settings, names, receipt prefix, currency MRU)
 * - Tab 3: مصفوفة الصلاحيات (Interactive Permissions Matrix)
 * - Tab 4: سجل التدقيق (Audit Log - tamper-proof record of all critical operations)
 * - Tab 5: أرشفة السنة (ArchiveStore - End of Year archiving with active tables wipe & speed optimization)
 * - Tab 6: النسخ الاحتياطي (Backup & Restore - Full JSON export & import without paid services)
 * - Tab 7: دليل النظام ومركز المساعدة (Help Center)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { BackupService } from '../../services/backupService';
import { FeeStructure, Grade, ArchiveRecord } from '../../types';
import {
  Settings,
  Building2,
  DollarSign,
  ShieldCheck,
  History,
  Database,
  Archive,
  HelpCircle,
  Save,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  Edit,
  School,
  AlertTriangle,
  FolderArchive,
  FileSpreadsheet
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { institutionId, currentInstitution, showToast, refreshKey, reloadAll } = useApp();

  const [activeTab, setActiveTab] = useState<'feeSetup' | 'institution' | 'permissions' | 'audit' | 'archive' | 'backup' | 'help'>('feeSetup');

  // Institution form state
  const [instNameAr, setInstNameAr] = useState(currentInstitution.nameAr);
  const [instNameFr, setInstNameFr] = useState(currentInstitution.nameFr);
  const [phone, setPhone] = useState(currentInstitution.phone);
  const [address, setAddress] = useState(currentInstitution.address);
  const [city, setCity] = useState(currentInstitution.city);
  const [currency, setCurrency] = useState(currentInstitution.currency || 'MRU');
  const [receiptPrefix, setReceiptPrefix] = useState(currentInstitution.receiptPrefix);
  const [gradingScale, setGradingScale] = useState(currentInstitution.gradingSystem || '0-20');

  React.useEffect(() => {
    setInstNameAr(currentInstitution.nameAr);
    setInstNameFr(currentInstitution.nameFr);
    setPhone(currentInstitution.phone);
    setAddress(currentInstitution.address);
    setCity(currentInstitution.city);
    setReceiptPrefix(currentInstitution.receiptPrefix);
  }, [currentInstitution]);

  // Fee setup state
  const grades = useMemo(() => StorageEngine.getGrades(institutionId), [institutionId, refreshKey]);
  const feeStructures = useMemo(() => StorageEngine.getFeeStructures(institutionId), [institutionId, refreshKey]);

  // Selected grade for fee editing
  const [selectedFeeGradeId, setSelectedFeeGradeId] = useState<string>(() => grades[0]?.id || '');

  React.useEffect(() => {
    if (grades.length > 0 && (!selectedFeeGradeId || !grades.some(g => g.id === selectedFeeGradeId))) {
      setSelectedFeeGradeId(grades[0].id);
    }
  }, [grades, selectedFeeGradeId]);

  const activeFeePlan = useMemo(() => {
    return feeStructures.find(f => f.gradeId === selectedFeeGradeId) || {
      id: `fs-${selectedFeeGradeId}`,
      institutionId,
      sectionId: 'sec-general',
      academicYearId: 'year-2025-2026',
      gradeId: selectedFeeGradeId,
      registrationFee: 1500,
      monthlyFee: 2000,
      transportFee: 800,
      uniformFee: 500
    };
  }, [feeStructures, selectedFeeGradeId, institutionId]);

  const [editRegFee, setEditRegFee] = useState(activeFeePlan.registrationFee);
  const [editMonthlyFee, setEditMonthlyFee] = useState(activeFeePlan.monthlyFee);
  const [editTransportFee, setEditTransportFee] = useState(activeFeePlan.transportFee || 0);

  React.useEffect(() => {
    setEditRegFee(activeFeePlan.registrationFee);
    setEditMonthlyFee(activeFeePlan.monthlyFee);
    setEditTransportFee(activeFeePlan.transportFee || 0);
  }, [activeFeePlan]);

  // Audit Logs
  const auditLogs = useMemo(() => {
    return StorageEngine.getAuditLogs(institutionId);
  }, [institutionId, refreshKey]);

  // Archives State
  const archives = useMemo(() => {
    return StorageEngine.getArchives().filter(a => a.institutionId === institutionId);
  }, [institutionId, refreshKey]);

  const activeStudents = useMemo(() => {
    return StorageEngine.getStudents(institutionId);
  }, [institutionId, refreshKey]);

  const activeInvoices = useMemo(() => {
    return StorageEngine.getInvoices(institutionId);
  }, [institutionId, refreshKey]);

  const activePayments = useMemo(() => {
    return StorageEngine.getPayments(institutionId);
  }, [institutionId, refreshKey]);

  const [archiveYearInput, setArchiveYearInput] = useState('2025-2026');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Handle Save Institution
  const handleSaveInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentInstitution,
      nameAr: instNameAr,
      nameFr: instNameFr,
      phone,
      address,
      city,
      currency,
      receiptPrefix,
      gradingSystem: gradingScale as any
    };
    StorageEngine.saveInstitution(updated);
    showToast('تم حفظ إعدادات المؤسسة بنجاح', 'success');
    reloadAll();
  };

  // Handle Save Fee Plan
  const handleSaveFeePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPlan: FeeStructure = {
      ...activeFeePlan,
      registrationFee: Number(editRegFee),
      monthlyFee: Number(editMonthlyFee),
      transportFee: Number(editTransportFee)
    };
    StorageEngine.saveFeeStructure(updatedPlan);

    StorageEngine.addAuditLog({
      institutionId,
      userId: 'current-user',
      userName: 'المدير المالي',
      userRole: 'super_admin',
      action: 'update',
      module: 'settings',
      recordId: updatedPlan.id,
      details: `تحديث خطة الرسوم للمرحلة ${grades.find(g => g.id === selectedFeeGradeId)?.nameAr}: تسجيل ${editRegFee} MRU، شهري ${editMonthlyFee} MRU`
    });

    showToast('تم حفظ خطة الرسوم المعتمدة للمرحلة بنجاح', 'success');
    reloadAll();
  };

  // Handle Execute Academic Year Archiving
  const handleExecuteArchive = () => {
    if (!archiveYearInput.trim()) {
      showToast('يرجى تحديد مسمى السنة الدراسية المراد أرشفتها', 'error');
      return;
    }

    try {
      setIsArchiving(true);
      const res = StorageEngine.archiveAcademicYear(archiveYearInput.trim(), institutionId);
      if (res.success) {
        showToast(res.message || 'تمت أرشفة السنة وتصفير الجداول النشطة بنجاح', 'success');
        setShowArchiveConfirm(false);
        reloadAll();
      } else {
        showToast(res.message || 'فشلت عملية الأرشفة', 'error');
      }
    } catch (err: any) {
      showToast('حدث خطأ أثناء أرشفة السنة الأكاديمية', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  // Download individual archive JSON
  const handleDownloadArchive = (record: ArchiveRecord) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Archive_${institutionId}_${record.academicYear.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON Database Export via BackupService
  const handleExportJSON = () => {
    try {
      BackupService.exportBackup(institutionId);
      showToast('تم تصدير نسخة احتياطية كاملة من البيانات بنجاح', 'success');
    } catch (e: any) {
      showToast(e.message || 'فشل التصدير', 'error');
    }
  };

  const [isRestoring, setIsRestoring] = useState(false);

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('تحذير: استعادة النسخة الاحتياطية ستقوم بتحديث وتطبيق البيانات المخزنة في الملف. هل تود المتابعة؟')) {
      e.target.value = '';
      return;
    }

    try {
      setIsRestoring(true);
      const text = await file.text();
      const { BackupService } = await import('../../services/backupService');
      const res = await BackupService.importBackup(text);
      if (res.success) {
        showToast(res.message, 'success');
        reloadAll();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast('خطأ أثناء قراءة ملف النسخة الاحتياطية', 'error');
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" />
            <span>الإعدادات الشاملة والصلاحيات - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            تهيئة هوية المؤسسة، خطط الرسوم، مصفوفة الصلاحيات، أرشفة السنة وتصفير الجداول النشطة
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center flex-wrap gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('feeSetup')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'feeSetup' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            إعداد الرسوم الدراسية
          </button>
          <button
            onClick={() => setActiveTab('institution')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'institution' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            بيانات المؤسسة
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'permissions' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            مصفوفة الصلاحيات
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'audit' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            سجل التدقيق
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'archive' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>أرشفة السنة</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'backup' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            النسخ الاحتياطي
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'help' ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            دليل النظام
          </button>
        </div>
      </div>

      {/* TAB 1: FEE SETUP */}
      {activeTab === 'feeSetup' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>إعداد الرسوم الدراسية المعتمدة لكل مرحلة (مكان مركزي واحد)</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                تحديد رسوم التسجيل، الرسوم الشهرية، ورسوم النقل. تنعكس تلقائياً عند تسجيل أي تلميذ جديد.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg font-mono">
              العملة: MRU
            </span>
          </div>

          {/* Select Grade */}
          <div className="max-w-md">
            <label className="block font-bold text-slate-700 mb-1">اختر المرحلة أو السنة الدراسية المراد ضبط رسومها:</label>
            <select
              value={selectedFeeGradeId}
              onChange={(e) => setSelectedFeeGradeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
            >
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.nameAr} ({g.nameFr})</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSaveFeePlan} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-700">
                  رسم التسجيل (يدفع مرة واحدة سنوياً) *:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={editRegFee}
                    onChange={(e) => setEditRegFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-base"
                  />
                  <span className="font-bold text-slate-500">MRU</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-700">
                  القسط الشهري المعتمد (Tuition Fee) *:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={editMonthlyFee}
                    onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-base text-emerald-700"
                  />
                  <span className="font-bold text-slate-500">MRU</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-700">
                  رسم النقل المدرسي (شهري - اختياري):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editTransportFee}
                    onChange={(e) => setEditTransportFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-base"
                  />
                  <span className="font-bold text-slate-500">MRU</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * ملاحظة نظام: تعديل خطة الرسوم لا يغير الفواتير أو الوصولات السابقة تلقائياً حفاظاً على الاتساق المحاسبي.
            </p>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد خطة الرسوم</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: INSTITUTION SETTINGS */}
      {activeTab === 'institution' && (
        <form onSubmit={handleSaveInstitution} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">بيانات وهوية المؤسسة التعليمية</h3>
            <p className="text-slate-500">اسم العلامة التجارية الثابت هو Ecole Bekar، واسم المدرسة الرسمي قابل للتخصيص للمطبوعات.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المؤسسة (بالعربية) *:</label>
              <input
                type="text"
                required
                value={instNameAr}
                onChange={(e) => setInstNameAr(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom officiel (Français) *:</label>
              <input
                type="text"
                required
                value={instNameFr}
                onChange={(e) => setInstNameFr(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف الرسمي:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المدينة والمقاطعة:</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">العنوان التفصيلي:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">بادئة تسلسل أرقام الوصولات:</label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">العملة المعتمدة:</label>
              <input
                type="text"
                disabled
                value="MRU (أوقية موريتانية)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نظام الدرجات الأكاديمي:</label>
              <select
                value={gradingScale}
                onChange={(e) => setGradingScale(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="0-20">نظام 0 إلى 20 (المعتمد في موريتانيا)</option>
                <option value="0-10">نظام 0 إلى 10</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات المؤسسة</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>مصفوفة الصلاحيات والأدوار (Permissions Matrix)</span>
              </h3>
              <p className="text-slate-500">فصل الواجبات (Separation of Duties) وفق مبدأ أقل صلاحية</p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-bold rounded-lg text-[10px]">
              RBAC Enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-center">
              <thead className="bg-slate-50 text-slate-600 font-bold">
                <tr>
                  <th className="p-2.5 border border-slate-200 text-right">الوحدة / الإجراء</th>
                  <th className="p-2.5 border border-slate-200">المدير العام</th>
                  <th className="p-2.5 border border-slate-200">مدير الكيان</th>
                  <th className="p-2.5 border border-slate-200">المحاسب</th>
                  <th className="p-2.5 border border-slate-200">أمين الصندوق</th>
                  <th className="p-2.5 border border-slate-200">الأستاذ</th>
                  <th className="p-2.5 border border-slate-200">الوكيل (ولي الأمر)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { module: 'شؤون التلاميذ وتسجيلهم', roles: [true, true, false, false, false, false] },
                  { module: 'تسجيل المقبوضات والوصولات', roles: [true, true, true, true, false, false] },
                  { module: 'إلغاء الوصولات (مع تدقيق)', roles: [true, true, true, false, false, false] },
                  { module: 'تسجيل المصروفات والنفقات', roles: [true, true, true, false, false, false] },
                  { module: 'إقفال الصندوق ومطابقة النقد', roles: [true, true, true, true, false, false] },
                  { module: 'جدول الحصص والغياب', roles: [true, true, false, false, true, false] },
                  { module: 'كشوف النقاط والدرجات', roles: [true, true, false, false, true, false] },
                  { module: 'الاطلاع على كشف حساب الأبناء', roles: [true, true, true, true, false, true] },
                  { module: 'إعداد الرسوم وتعديل مبالغ التلاميذ', roles: [true, true, false, false, false, false] },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-bold text-slate-800 text-right">{row.module}</td>
                    {row.roles.map((hasPerm, pIdx) => (
                      <td key={pIdx} className="p-2.5 border border-slate-200">
                        {hasPerm ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300 font-bold">✕</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden text-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-500 font-semibold">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-900 font-bold">مسار وسجل التدقيق الإداري والمالي (Audit Log)</span>
            </div>
            <span>سجل دائم غير قابل للتعديل</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4">الوقت والتاريخ</th>
                  <th className="py-3 px-4">المستخدم</th>
                  <th className="py-3 px-4">الصلاحية</th>
                  <th className="py-3 px-4">نوع العملية</th>
                  <th className="py-3 px-4">الوحدة</th>
                  <th className="py-3 px-4">التفاصيل والبيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.userName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.userRole}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'create' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'void' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.module}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ANNUAL ACADEMIC ARCHIVE (ArchiveStore) */}
      {activeTab === 'archive' && (
        <div className="space-y-6 text-xs animate-in fade-in">
          {/* Action Card: End of Year Archive */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-indigo-600" />
                  <span>أرشفة السنة الأكاديمية (ArchiveStore) وتصفير الجداول النشطة</span>
                </h3>
                <p className="text-slate-500 max-w-2xl">
                  تقوم هذه العملية بنقل ملفات التلاميذ، الفواتير، المقبوضات والغياب للسنة المنتهية إلى جداول الأرشيف التراكمية،
                  ثم تصفير الجداول النشطة لاستقبال العام الدراسي الجديد مما يضمن أقصى سرعة واستجابة للنظام.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-bold text-[11px] shrink-0">
                إجراء نهاية السنة
              </span>
            </div>

            {/* Current Active Data Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px]">التلاميذ النشطون حالياً:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{activeStudents.length} تلميذ</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الفواتير المستحقة:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{activeInvoices.length} فاتورة</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الوصولات المحصلة:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{activePayments.length} وصل</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">إجمالي الإيرادات النشطة:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  {activePayments.filter(p => !p.isCancelled).reduce((s, p) => s + p.amountPaid, 0).toLocaleString()} MRU
                </span>
              </div>
            </div>

            {/* Archiving Form */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
              <div className="flex-1 max-w-sm">
                <label className="block font-bold text-slate-700 mb-1">
                  مسمى السنة الدراسية المنتهية للأرشفة:
                </label>
                <input
                  type="text"
                  value={archiveYearInput}
                  onChange={(e) => setArchiveYearInput(e.target.value)}
                  placeholder="مثال: 2025-2026"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowArchiveConfirm(true)}
                disabled={activeStudents.length === 0 && activeInvoices.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <span>أرشفة السنة وتصفير الجداول النشطة</span>
              </button>
            </div>
          </div>

          {/* Archived School Years Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900">سجل السنوات الأكاديمية المؤرشفة (ArchiveStore)</h4>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-500">
                {archives.length} سنة مؤرشفة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-600 border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">السنة الأكاديمية</th>
                    <th className="py-3 px-4">تاريخ الأرشفة</th>
                    <th className="py-3 px-4">عدد التلاميذ المؤرشفين</th>
                    <th className="py-3 px-4">الفواتير</th>
                    <th className="py-3 px-4">المقبوضات المحصلة</th>
                    <th className="py-3 px-4">إجمالي الإيرادات (MRU)</th>
                    <th className="py-3 px-4 text-center">إجراءات الأرشيف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {archives.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        لا توجد سنوات أكاديمية مؤرشفة حتى الآن. عند نهاية العام يمكنك نقل البيانات هنا بضغطة زر.
                      </td>
                    </tr>
                  ) : (
                    archives.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {rec.academicYear}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {new Date(rec.archivedAt).toLocaleDateString('ar-MR')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {rec.studentCount} تلميذ
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {rec.invoicesCount} فاتورة
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {rec.paymentsCount} وصل
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {rec.totalRevenue.toLocaleString()} MRU
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDownloadArchive(rec)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="تحميل ملف أرشيف السنة بصيغة JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تنزيل JSON</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirmation Modal */}
          {showArchiveConfirm && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">تأكيد أرشفة السنة وتصفير الجداول</h3>
                    <p className="text-[11px] text-slate-500">هذا الإجراء ينفذ نهاية السنة الدراسية</p>
                  </div>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs text-amber-950 leading-relaxed">
                  <p className="font-bold">هل أنت متأكد من أرشفة بيانات السنة الأكاديمية ({archiveYearInput})؟</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90">
                    <li>سيتم حفظ جميع التلاميذ والفواتير والوصولات الحالية بأمان في سجلات الأرشيف (ArchiveStore).</li>
                    <li>سيتم تصفير قوائم التلاميذ النشطة لتكون مستعدة للعام الدراسي الجديد.</li>
                    <li>يمكنك دائماً مراجعة البيانات وتنزيل ملف الأرشيف الكامل في أي وقت.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowArchiveConfirm(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء التراجع
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteArchive}
                    disabled={isArchiving}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isArchiving ? 'جاري الأرشفة...' : 'نعم، أرشف السنة وصفر الجداول'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs max-w-2xl">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>النسخ الاحتياطي والاستعادة الذاتية (Offline-Compatible JSON)</span>
            </h3>
            <p className="text-slate-500 mt-0.5">
              تصدير أرشيف كامل وشامل لكافة قواعد بيانات المدرسة والمعهد دون الحاجة لأي اشتراكات مدفوعة.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Export Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900">تصدير قاعدة البيانات الحالية (JSON Archive)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يشمل التلاميذ، الفواتير، الوصولات، المصروفات، الجداول وسجل التدقيق.
                </p>
              </div>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل نسخة احتياطية (JSON)</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-indigo-950">استعادة قاعدة البيانات من ملف (Restore JSON)</h4>
                <p className="text-[11px] text-indigo-900/70 mt-0.5">
                  استيراد وتحديث البيانات الأكاديمية والمالية من ملف نسخ احتياطي تم تصديره سابقاً.
                </p>
              </div>
              <label className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{isRestoring ? 'جاري الاستعادة...' : 'استيراد نسخة احتياطية'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  disabled={isRestoring}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM GUIDE & HELP */}
      {activeTab === 'help' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>دليل المستخدم وسير العمل اليومي في منصة مجمع مدارس بكار الحرة</span>
          </h3>

          <div className="space-y-3 text-slate-700 leading-relaxed">
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <h4 className="font-bold text-indigo-900 mb-1">1. التبديل بين المدرسة والمعهد:</h4>
              <p>
                استخدم المبدل الموجود أعلى الواجهة (المدرسة ⇄ معهد التربية الحديثة).
                المعهد مخصص حصرياً للمرحلة الابتدائية من السنة 1 إلى 4، بينما المدرسة تدير باقي المراحل والسنوات.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <h4 className="font-bold text-emerald-900 mb-1">2. تسجيل تلميذ جديد:</h4>
              <p>
                انتقل إلى «التلاميذ» ثم «تسجيل تلميذ جديد». خطوات بسيطة تحتسب الرسوم تلقائياً وتتيح تطبيق خصم الإخوة أو الإعفاء مع حفظ الاستحقاقات دون إنشاء دفعة وهمية.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <h4 className="font-bold text-amber-900 mb-1">3. قبض الدفعات وإصدار الوصولات:</h4>
              <p>
                انقر على زر «قبض دفعة» في أعلى الشاشة أو من صفحة المدفوعات. حدد التلميذ والمبلغ، وسيتم إصدار وصل برقم متسلسل فوري مع تحديث فوري للصندوق اليومي.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-1">4. أرشفة السنة المنتهية:</h4>
              <p>
                من تبويب «أرشفة السنة»، حدد السنة المنتهية وأكد الأرشفة لتفريغ السجلات النشطة وحفظها في ArchiveStore مع إمكانية تصديرها في أي وقت كملف JSON.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
