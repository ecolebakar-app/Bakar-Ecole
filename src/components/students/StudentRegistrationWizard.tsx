/**
 * 5-Step Student Registration Wizard for Ecole Bekar
 * Conforms to Executive Specification:
 * Step 1: Student Information
 * Step 2: Guardian Information
 * Step 3: Grade & Class Selection
 * Step 4: Tuition & Fee Plan (auto-calculated from grade, allows custom adjustment & exemptions)
 * Step 5: Review & Save -> Shows summary with instant "تسجيل دفعة" action.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Student, Guardian, Grade, ClassRoom } from '../../types';
import { CheckCircle2, User, Phone, School, DollarSign, ArrowRight, ArrowLeft, Save, PlusCircle, Check } from 'lucide-react';

interface StudentRegistrationWizardProps {
  onSuccess: (student: Student) => void;
  onCancel: () => void;
}

export const StudentRegistrationWizard: React.FC<StudentRegistrationWizardProps> = ({ onSuccess, onCancel }) => {
  const { institutionId, currentInstitution, sectionId, showToast, setQuickPaymentOpen } = useApp();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  // Step 1: Student
  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [firstNameFr, setFirstNameFr] = useState('');
  const [lastNameFr, setLastNameFr] = useState('');
  const [birthDate, setBirthDate] = useState('2019-01-01');
  const [birthPlace, setBirthPlace] = useState('نواكشوط');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [rimNumber, setRimNumber] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');

  // Step 2: Guardian
  const [selectedGuardianMode, setSelectedGuardianMode] = useState<'new' | 'existing'>('new');
  const [existingGuardianId, setExistingGuardianId] = useState('');
  const [guardianNameAr, setGuardianNameAr] = useState('');
  const [guardianNameFr, setGuardianNameFr] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState<Guardian['relationship']>('father');
  const [guardianPhone1, setGuardianPhone1] = useState('');
  const [guardianPhone2, setGuardianPhone2] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('نواكشوط');
  const [guardianProfession, setGuardianProfession] = useState('');

  // Step 3: Grade & Class
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Step 4: Fees & Exemptions
  const [customMonthlyFee, setCustomMonthlyFee] = useState<number | ''>('');
  const [customRegFee, setCustomRegFee] = useState<number | ''>('');
  const [feeOverrideReason, setFeeOverrideReason] = useState('');
  const [exemptionType, setExemptionType] = useState<Student['exemptionType']>('none');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [exemptionReason, setExemptionReason] = useState('');

  // Result state after saving
  const [savedStudentResult, setSavedStudentResult] = useState<Student | null>(null);

  // Available Data
  const grades = useMemo(() => StorageEngine.getGrades(institutionId), [institutionId]);
  const classes = useMemo(() => {
    if (!selectedGradeId) return [];
    return StorageEngine.getClasses(institutionId, undefined, selectedGradeId);
  }, [institutionId, selectedGradeId]);

  const existingGuardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId]);

  // Set initial grade if not set
  React.useEffect(() => {
    if (grades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(grades[0].id);
    }
  }, [grades, selectedGradeId]);

  React.useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.some(c => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Auto-calculated fee defaults based on selected grade
  const defaultFeePlan = useMemo(() => {
    const plans = StorageEngine.getFeeStructures(institutionId, undefined, selectedGradeId);
    return plans[0] || { registrationFee: 1500, monthlyFee: 2000 };
  }, [institutionId, selectedGradeId]);

  // Calculations for step 4
  const finalRegFee = customRegFee !== '' ? Number(customRegFee) : defaultFeePlan.registrationFee;
  const finalMonthlyFee = customMonthlyFee !== '' ? Number(customMonthlyFee) : defaultFeePlan.monthlyFee;

  let totalDue = finalRegFee + finalMonthlyFee;
  if (exemptionType === 'full') {
    totalDue = 0;
  } else if (discountPercentage > 0) {
    totalDue = Math.round(totalDue * (1 - discountPercentage / 100));
  }

  // Handle final submission
  const handleSave = () => {
    if (!firstNameAr || !lastNameAr) {
      showToast('يرجى ملء الاسم الشخصي والعائلي بالعربية', 'error');
      setCurrentStep(1);
      return;
    }
    if (!selectedGradeId || !selectedClassId) {
      showToast('يرجى اختيار المرحلة والفصل الدراسي', 'error');
      setCurrentStep(3);
      return;
    }

    // Prepare Guardian
    let guardianId = existingGuardianId;
    if (selectedGuardianMode === 'new') {
      if (!guardianNameAr || !guardianPhone1) {
        showToast('يرجى إدخال اسم الوكيل ورقم هاتفه', 'error');
        setCurrentStep(2);
        return;
      }
      guardianId = `grd-${Date.now()}`;
      const newGuardian: Guardian = {
        id: guardianId,
        institutionId,
        sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
        nameAr: guardianNameAr,
        nameFr: guardianNameFr || guardianNameAr,
        relationship: guardianRelationship,
        phone1: guardianPhone1,
        phone2: guardianPhone2 || undefined,
        address: guardianAddress,
        profession: guardianProfession || undefined
      };
      StorageEngine.saveGuardian(newGuardian);
    }

    const { student } = StorageEngine.registerStudent({
      institutionId,
      sectionId: sectionId !== 'all' ? sectionId : 'sec-general',
      academicYearId: 'year-2025-2026',
      gradeId: selectedGradeId,
      classId: selectedClassId,
      guardianId,
      rimNumber: rimNumber || undefined,
      firstNameAr,
      lastNameAr,
      firstNameFr: firstNameFr || firstNameAr,
      lastNameFr: lastNameFr || lastNameAr,
      birthDate,
      birthPlace,
      gender,
      previousSchool: previousSchool || undefined,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'active',
      customRegistrationFee: customRegFee !== '' ? Number(customRegFee) : undefined,
      customMonthlyFee: customMonthlyFee !== '' ? Number(customMonthlyFee) : undefined,
      feeOverrideReason: feeOverrideReason || undefined,
      exemptionType,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      exemptionReason: exemptionReason || undefined
    }, { createInitialInvoices: true });

    setSavedStudentResult(student);
    showToast(`تم تسجيل التلميذ بنجاح برقم قيد: ${student.registrationNumber}`, 'success');
  };

  // If saved, show summary card
  if (savedStudentResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">تم تسجيل التلميذ بنجاح في {currentInstitution.nameAr}</h2>
          <p className="text-xs text-slate-500 mt-1">تم إنشاء سجل التلميذ وحسابه المالي واستحقاقات الرسوم تلقائياً</p>
        </div>

        {/* Student & Dues Summary Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-right space-y-3 text-xs">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">اسم التلميذ:</span>
            <span className="font-bold text-slate-900">{savedStudentResult.firstNameAr} {savedStudentResult.lastNameAr}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">رقم القيد الرسمي:</span>
            <span className="font-mono font-bold text-blue-700">{savedStudentResult.registrationNumber}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">إجمالي الرسوم المستحقة (التسجيل + شهر أكتوبر):</span>
            <span className="font-mono font-black text-slate-900">{totalDue.toLocaleString()} MRU</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">حالة الإعفاء / الخصم:</span>
            <span className="font-bold text-indigo-700">
              {savedStudentResult.exemptionType === 'full' ? 'معفى كلياً (100%)' :
               savedStudentResult.exemptionType === 'brother_discount' ? `خصم إخوة (${discountPercentage}%)` :
               savedStudentResult.exemptionType === 'partial' ? `خصم جزئي (${discountPercentage}%)` : 'يدفع كامل الرسوم'}
            </span>
          </div>
        </div>

        {/* Next Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setQuickPaymentOpen(true);
              onSuccess(savedStudentResult);
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل دفعة وإصدار وصل الآن</span>
          </button>
          <button
            onClick={() => onSuccess(savedStudentResult)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            الانتقال لملف التلميذ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header with Steps Progress */}
      <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">تسجيل تلميذ جديد - {currentInstitution.nameAr}</h2>
          <p className="text-xs text-slate-400">إجراء منظم في 5 خطوات بسيطة مع احتساب تلقائي للرسوم</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              onClick={() => step < currentStep && setCurrentStep(step)}
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all ${
                step === currentStep
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                  : step < currentStep
                  ? 'bg-emerald-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {step < currentStep ? <Check className="w-3.5 h-3.5" /> : step}
            </div>
          ))}
        </div>
      </div>

      {/* Body Steps */}
      <div className="p-6">
        {/* Step 1: Student Information */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span>الخطوة 1: البيانات الشخصية للتلميذ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الشخصي (بالعربية) *:</label>
                <input
                  type="text"
                  required
                  value={firstNameAr}
                  onChange={(e) => setFirstNameAr(e.target.value)}
                  placeholder="مثال: محمد"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العائلة (بالعربية) *:</label>
                <input
                  type="text"
                  required
                  value={lastNameAr}
                  onChange={(e) => setLastNameAr(e.target.value)}
                  placeholder="مثال: ولد المختار"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom (الفرنسية - اختياري):</label>
                <input
                  type="text"
                  value={firstNameFr}
                  onChange={(e) => setFirstNameFr(e.target.value)}
                  placeholder="Ex: Mohamed"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom (الفرنسية - اختياري):</label>
                <input
                  type="text"
                  value={lastNameFr}
                  onChange={(e) => setLastNameFr(e.target.value)}
                  placeholder="Ex: Ould El Mokhtar"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد *:</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مكان الميلاد:</label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="نواكشوط، كيفة، روصو..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الجنس *:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="male">ذكر (Garçon)</option>
                  <option value="female">أنثى (Fille)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الماتريكول / رقم RIM (اختياري):</label>
                <input
                  type="text"
                  value={rimNumber}
                  onChange={(e) => setRimNumber(e.target.value)}
                  placeholder="RIM-XXXXX"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Guardian Information */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>الخطوة 2: بيانات ولي الأمر (الوكيل المالي)</span>
            </h3>

            {/* Toggle between existing guardian or new guardian */}
            <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl text-xs font-medium w-fit">
              <button
                type="button"
                onClick={() => setSelectedGuardianMode('new')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${selectedGuardianMode === 'new' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
              >
                تسجيل وكيل جديد
              </button>
              <button
                type="button"
                onClick={() => setSelectedGuardianMode('existing')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${selectedGuardianMode === 'existing' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
              >
                اختيار وكيل مسجل مسبقاً (ربط إخوة)
              </button>
            </div>

            {selectedGuardianMode === 'existing' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الوكيل المسجل:</label>
                <select
                  value={existingGuardianId}
                  onChange={(e) => setExistingGuardianId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- حدد ولي الأمر --</option>
                  {existingGuardians.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nameAr} ({g.phone1}) - {g.relationship === 'father' ? 'أب' : 'أم'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-emerald-600 mt-1.5">
                  ✓ باختيار وكيل مسجل مسبقاً، سيتم اقتراح خصم الإخوة تلقائياً في الخطوة الرابعة.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم ولي الأمر بالكامل *:</label>
                  <input
                    type="text"
                    required
                    value={guardianNameAr}
                    onChange={(e) => setGuardianNameAr(e.target.value)}
                    placeholder="مثال: أحمد ولد السالم"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">صلة القرابة *:</label>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="father">أب (Père)</option>
                    <option value="mother">أم (Mère)</option>
                    <option value="guardian">وصي قانوني (Tuteur)</option>
                    <option value="financial_sponsor">كفيل مالي (Garant financier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الأساسي *:</label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone1}
                    onChange={(e) => setGuardianPhone1(e.target.value)}
                    placeholder="مثال: 46450011"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف ثانٍ (اختياري):</label>
                  <input
                    type="tel"
                    value={guardianPhone2}
                    onChange={(e) => setGuardianPhone2(e.target.value)}
                    placeholder="هاتف 2..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العنوان / الحي:</label>
                  <input
                    type="text"
                    value={guardianAddress}
                    onChange={(e) => setGuardianAddress(e.target.value)}
                    placeholder="تفرغ زينة، عرفات..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مهنة الوكيل:</label>
                  <input
                    type="text"
                    value={guardianProfession}
                    onChange={(e) => setGuardianProfession(e.target.value)}
                    placeholder="مهندس، تاجر، موظف..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Grade & Class */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <School className="w-4 h-4 text-emerald-600" />
              <span>الخطوة 3: اختيار المرحلة والسنة والفصل الدراسي</span>
            </h3>

            {institutionId === 'institut' && (
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs border border-emerald-200">
                <strong>تنبيه المؤسسة:</strong> معهد التربية الحديثة للعلوم الإسلامية مخصص حصرياً للمرحلة الابتدائية (من السنة الأولى إلى السنة الرابعة).
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة / السنة الدراسية *:</label>
                <select
                  value={selectedGradeId}
                  onChange={(e) => setSelectedGradeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nameAr} ({g.nameFr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الفصل الدراسي *:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} (السعة: {c.capacity} مقعد)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المدرسة السابقة (إن وجدت):</label>
                <input
                  type="text"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  placeholder="اسم المدرسة السابقة..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Fees & Exemptions */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>الخطوة 4: الرسوم الدراسية والخصومات (احتساب تلقائي)</span>
            </h3>

            {/* Standard Grade Fees Info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">الخطة المالية الافتراضية لهذه المرحلة:</span>
                <span className="font-bold text-slate-800">
                  رسم التسجيل: {defaultFeePlan.registrationFee} MRU | القسط الشهري: {defaultFeePlan.monthlyFee} MRU
                </span>
              </div>
              <span className="px-2 py-1 bg-white text-slate-600 rounded-md border font-medium">خطة معتمدة</span>
            </div>

            {/* Custom Overrides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تخصيص رسم تسجيل لهذا التلميذ (اختياري):
                </label>
                <input
                  type="number"
                  placeholder={`الافتراضي: ${defaultFeePlan.registrationFee}`}
                  value={customRegFee}
                  onChange={(e) => setCustomRegFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تخصيص قسط شهري لهذا التلميذ (اختياري):
                </label>
                <input
                  type="number"
                  placeholder={`الافتراضي: ${defaultFeePlan.monthlyFee}`}
                  value={customMonthlyFee}
                  onChange={(e) => setCustomMonthlyFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الإعفاء / الخصم:</label>
                <select
                  value={exemptionType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setExemptionType(val);
                    if (val === 'brother_discount') setDiscountPercentage(15);
                    else if (val === 'full') setDiscountPercentage(100);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="none">بدون خصم (يدفع كامل الرسوم)</option>
                  <option value="brother_discount">خصم الأخوة (مستحسن 15%)</option>
                  <option value="partial">خصم جزئي بالنسبة المئوية</option>
                  <option value="full">معفى كلياً (100% مجاناً)</option>
                  <option value="scholarship">منحة دراسية / تكفل جهة</option>
                </select>
              </div>

              {exemptionType !== 'none' && exemptionType !== 'full' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الخصم المئوية (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {exemptionType !== 'none' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب الإعفاء / جهة الاعتماد:</label>
                <input
                  type="text"
                  value={exemptionReason}
                  onChange={(e) => setExemptionReason(e.target.value)}
                  placeholder="مثال: خصم إخوة معتمد / منحة تفوق / بقرار من المدير العام..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Total summary box */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">
                إجمالي الرسوم المستحقة للتلميذ (التسجيل + شهر أكتوبر):
              </span>
              <span className="text-base font-black font-mono text-emerald-800">
                {totalDue.toLocaleString()} MRU
              </span>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              الخطوة 5: مراجعة نهائية واعتماد التسجيل
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">التلميذ:</span>
                <span className="font-bold text-slate-900">{firstNameAr} {lastNameAr}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">ولي الأمر:</span>
                <span className="font-bold text-slate-900">
                  {selectedGuardianMode === 'new' ? guardianNameAr : existingGuardians.find(g => g.id === existingGuardianId)?.nameAr}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">المرحلة والفصل:</span>
                <span className="font-bold text-slate-900">
                  {grades.find(g => g.id === selectedGradeId)?.nameAr} - {classes.find(c => c.id === selectedClassId)?.nameAr}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">المستحق الأولي:</span>
                <span className="font-bold font-mono text-emerald-700">{totalDue.toLocaleString()} MRU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ملاحظة نظام:</span>
                <span className="text-slate-600">
                  حفظ التسجيل سينشئ المستحقات فقط، ولن يتم تسجيل دفعة تلقائياً حتى يقوم الوكيل بالدفع الفعلي.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>السابق</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            إلغاء
          </button>
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
          >
            <span>التالي</span>
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>اعتماد وحفظ التسجيل</span>
          </button>
        )}
      </div>
    </div>
  );
};
