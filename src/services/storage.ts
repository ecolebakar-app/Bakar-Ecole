/**
 * Storage Service & Data Repository for Ecole Bekar
 * Implements Offline-First Local Storage Engine matching Firestore schemas
 * Supports atomic financial operations, data isolation (institutionId + sectionId),
 * outbox queue, audit logging, and seed initialization.
 */

import {
  Institution,
  Section,
  AcademicYear,
  Grade,
  ClassRoom,
  Subject,
  TimetableSlot,
  Student,
  Guardian,
  Teacher,
  TeacherAdvance,
  FeeType,
  FeeStructure,
  Invoice,
  PaymentReceipt,
  Expense,
  CashRegisterDay,
  NotificationItem,
  ConsolidatedDebtFile,
  AttendanceRecord,
  Exam,
  Mark,
  AuditLog,
  InstitutionId,
  TeacherAttendanceRecord,
  StudentBehaviorRecord,
  PrimaryBulletinRecord,
  SecondaryBulletinRecord,
  ArchiveRecord
} from '../types';

const STORAGE_KEYS = {
  INSTITUTIONS: 'eb_institutions',
  SECTIONS: 'eb_sections',
  ACADEMIC_YEARS: 'eb_academic_years',
  GRADES: 'eb_grades',
  CLASSES: 'eb_classes',
  SUBJECTS: 'eb_subjects',
  TIMETABLES: 'eb_timetables',
  STUDENTS: 'eb_students',
  GUARDIANS: 'eb_guardians',
  TEACHERS: 'eb_teachers',
  ADVANCES: 'eb_advances',
  FEE_TYPES: 'eb_fee_types',
  FEE_STRUCTURES: 'eb_fee_structures',
  INVOICES: 'eb_invoices',
  PAYMENTS: 'eb_payments',
  EXPENSES: 'eb_expenses',
  CASH_REGISTERS: 'eb_cash_registers',
  NOTIFICATIONS: 'eb_notifications',
  DEBT_FILES: 'eb_debt_files',
  ATTENDANCE: 'eb_attendance',
  EXAMS: 'eb_exams',
  MARKS: 'eb_marks',
  AUDIT_LOGS: 'eb_audit_logs',
  TEACHER_ATTENDANCE: 'eb_teacher_attendance',
  BEHAVIOR_RECORDS: 'eb_behavior_records',
  BULLETINS: 'eb_bulletins',
  SECONDARY_BULLETINS: 'eb_secondary_bulletins',
  ARCHIVES: 'eb_archives',
  INITIALIZED: 'eb_db_initialized_v2'
};

// Default Institutions
const DEFAULT_INSTITUTIONS: Institution[] = [
  {
    id: 'ecole',
    nameAr: 'مجمع مدارس بكار الحرة',
    nameFr: 'Complexe des écoles privées BAKAR',
    code: 'EBP',
    descriptionAr: 'المؤسسة الأساسية - إدارة كافة المراحل (ما قبل الابتدائي، الابتدائي، الإعدادي، الثانوي)',
    isInstitute: false,
    phone: '+222 45 25 00 01',
    email: 'ecolebekar@gmail.com',
    address: 'شارع النجاح، تفرغ زينة',
    city: 'نواكشوط (Nouakchott)',
    moughataa: 'تفرغ زينة (Tevragh Zeina)',
    receiptPrefix: 'REC-B',
    currency: 'MRU',
    gradingSystem: '0-20',
    reminderDaysBeforeMonthEnd: 5
  },
  {
    id: 'institut',
    nameAr: 'معهد التربية الحديثة للعلوم الإسلامية',
    nameFr: 'Institut Moderne des Sciences Islamiques',
    code: 'IMSI',
    descriptionAr: 'فرع تابع للمدرسة مخصص حصرياً للمرحلة الابتدائية (من السنة الأولى إلى الرابعة فقط)',
    isInstitute: true, // Restricted to primary 1 to 4
    phone: '+222 45 25 00 02',
    email: 'institut.bekar@gmail.com',
    address: 'حي الزهور، عرفات',
    city: 'نواكشوط (Nouakchott)',
    moughataa: 'عرفات (Arafat)',
    receiptPrefix: 'REC-I',
    currency: 'MRU',
    gradingSystem: '0-20',
    reminderDaysBeforeMonthEnd: 5
  }
];

const DEFAULT_SECTIONS: Section[] = [
  { id: 'sec-school-general', institutionId: 'ecole', nameAr: 'التعليم العام', nameFr: 'Enseignement Général', order: 1 },
  { id: 'sec-school-bilingual', institutionId: 'ecole', nameAr: 'القسم ثنائي اللغة', nameFr: 'Section Bilingue', order: 2 },
  { id: 'sec-inst-islamic', institutionId: 'institut', nameAr: 'القسم القرآني والشرعي', nameFr: 'Section Études Islamiques', order: 1 },
  { id: 'sec-inst-primary', institutionId: 'institut', nameAr: 'الابتدائي النموذجي', nameFr: 'Primaire Modèle', order: 2 }
];

const DEFAULT_YEARS: AcademicYear[] = [
  {
    id: 'year-2025-2026',
    institutionId: 'ecole',
    name: '2025-2026',
    startDate: '2025-10-01',
    endDate: '2026-06-30',
    isActive: true,
    isArchived: false
  },
  {
    id: 'year-inst-2025-2026',
    institutionId: 'institut',
    name: '2025-2026',
    startDate: '2025-10-01',
    endDate: '2026-06-30',
    isActive: true,
    isArchived: false
  }
];

// Institute: STRICTLY Grades 1 to 4 of Primary only!
// School: Pre-school, Primary, Middle, Secondary
const DEFAULT_GRADES: Grade[] = [
  // Institute grades: Primary 1 to 4 only
  { id: 'grd-inst-1', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', nameAr: 'السنة الأولى ابتدائية', nameFr: '1AS (1ère Année)', code: '1AS', order: 1, stage: 'primary', isActive: true },
  { id: 'grd-inst-2', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', nameAr: 'السنة الثانية ابتدائية', nameFr: '2AS (2ème Année)', code: '2AS', order: 2, stage: 'primary', isActive: true },
  { id: 'grd-inst-3', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', nameAr: 'السنة الثالثة ابتدائية', nameFr: '3AS (3ème Année)', code: '3AS', order: 3, stage: 'primary', isActive: true },
  { id: 'grd-inst-4', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', nameAr: 'السنة الرابعة ابتدائية', nameFr: '4AS (4ème Année)', code: '4AS', order: 4, stage: 'primary', isActive: true },

  // School Stage 1: ما قبل الابتدائية (Pre-school / Maternelle)
  { id: 'grd-sch-pre-1', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'روضة أطفال (تمهيدي صغرى)', nameFr: 'Petite Section (Maternelle)', code: 'PS', order: 1, stage: 'preschool', isActive: true },
  { id: 'grd-sch-pre-2', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'روضة أطفال (تمهيدي كبرى)', nameFr: 'Grande Section (Maternelle)', code: 'GS', order: 2, stage: 'preschool', isActive: true },

  // School Stage 2: الابتدائية (Primary: 1st to 6th)
  { id: 'grd-sch-1', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الأولى ابتدائية', nameFr: '1AF (1ère Année)', code: '1AF', order: 3, stage: 'primary', isActive: true },
  { id: 'grd-sch-2', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الثانية ابتدائية', nameFr: '2AF (2ème Année)', code: '2AF', order: 4, stage: 'primary', isActive: true },
  { id: 'grd-sch-3', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الثالثة ابتدائية', nameFr: '3AF (3ème Année)', code: '3AF', order: 5, stage: 'primary', isActive: true },
  { id: 'grd-sch-4', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الرابعة ابتدائية', nameFr: '4AF (4ème Année)', code: '4AF', order: 6, stage: 'primary', isActive: true },
  { id: 'grd-sch-5', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الخامسة ابتدائية', nameFr: '5AF (5ème Année)', code: '5AF', order: 7, stage: 'primary', isActive: true },
  { id: 'grd-sch-6', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة السادسة ابتدائية (مسابقة دخول الإعدادية)', nameFr: '6AF (Concours)', code: '6AF', order: 8, stage: 'primary', isActive: true },

  // School Stage 3: الإعدادية (Middle / Collège: 1st to 4th)
  { id: 'grd-sch-m1', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الأولى إعدادية', nameFr: '1AS Collège', code: '1AC', order: 9, stage: 'middle', isActive: true },
  { id: 'grd-sch-m2', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الثانية إعدادية', nameFr: '2AS Collège', code: '2AC', order: 10, stage: 'middle', isActive: true },
  { id: 'grd-sch-m3', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الثالثة إعدادية', nameFr: '3AS Collège', code: '3AC', order: 11, stage: 'middle', isActive: true },
  { id: 'grd-sch-m4', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الرابعة إعدادية (شهادة الإعدادية Brevet)', nameFr: '4AS Collège (Brevet)', code: '4AC', order: 12, stage: 'middle', isActive: true },

  // School Stage 4: الثانوية (Secondary / Lycée: 5th to 7th Bac)
  { id: 'grd-sch-s1', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة الخامسة ثانوية (رياضيات)', nameFr: '5ème C (Maths)', code: '5C', order: 13, stage: 'secondary', isActive: true },
  { id: 'grd-sch-s2', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة السادسة ثانوية (علوم طبيعية)', nameFr: '6ème D (Sciences)', code: '6D', order: 14, stage: 'secondary', isActive: true },
  { id: 'grd-sch-s3', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', nameAr: 'السنة السابعة ثانوية (باكالوريا)', nameFr: '7ème Terminale (Bac)', code: '7BAC', order: 15, stage: 'secondary', isActive: true }
];

const DEFAULT_CLASSES: ClassRoom[] = [
  { id: 'cls-inst-1a', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-1', academicYearId: 'year-inst-2025-2026', nameAr: 'أولى ابتدائي - أ', nameFr: '1AS - A', capacity: 30, isActive: true },
  { id: 'cls-inst-1b', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-1', academicYearId: 'year-inst-2025-2026', nameAr: 'أولى ابتدائي - ب', nameFr: '1AS - B', capacity: 30, isActive: true },
  { id: 'cls-inst-2a', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-2', academicYearId: 'year-inst-2025-2026', nameAr: 'ثانية ابتدائي - أ', nameFr: '2AS - A', capacity: 28, isActive: true },
  { id: 'cls-inst-3a', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-3', academicYearId: 'year-inst-2025-2026', nameAr: 'ثالثة ابتدائي - أ', nameFr: '3AS - A', capacity: 25, isActive: true },
  { id: 'cls-inst-4a', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-4', academicYearId: 'year-inst-2025-2026', nameAr: 'رابعة ابتدائي - أ', nameFr: '4AS - A', capacity: 25, isActive: true },

  { id: 'cls-sch-pre1', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-pre-1', academicYearId: 'year-2025-2026', nameAr: 'روضة صغرى - أ', nameFr: 'PS - A', capacity: 20, isActive: true },
  { id: 'cls-sch-pre2', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-pre-2', academicYearId: 'year-2025-2026', nameAr: 'روضة كبرى - تمهيدي', nameFr: 'GS - A', capacity: 25, isActive: true },
  { id: 'cls-sch-1a', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-1', academicYearId: 'year-2025-2026', nameAr: 'أولى ابتدائي - مدرسة', nameFr: '1AF - A', capacity: 30, isActive: true },
  { id: 'cls-sch-5a', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-5', academicYearId: 'year-2025-2026', nameAr: 'خامسة ابتدائي - أ', nameFr: '5AF - A', capacity: 32, isActive: true },
  { id: 'cls-sch-6a', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-6', academicYearId: 'year-2025-2026', nameAr: 'سادسة ابتدائي - مسابقة', nameFr: '6AF - Concours', capacity: 35, isActive: true },
  { id: 'cls-sch-m1a', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-m1', academicYearId: 'year-2025-2026', nameAr: 'أولى إعدادية - أ', nameFr: '1AC - A', capacity: 35, isActive: true }
];

const DEFAULT_SUBJECTS: Subject[] = [
  // Primary subjects with maxScore (المجموع)
  { id: 'sbj-inst-quran', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-1', nameAr: 'القرآن الكريم والتربية الإسلامية', nameFr: 'Saint Coran & Éduc. Islamique', category: 'islamic', maxScore: 20, coefficient: 1, weeklyHours: 6, order: 1 },
  { id: 'sbj-inst-ar', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-1', nameAr: 'اللغة العربية والخط والإنشاء', nameFr: 'Langue Arabe', category: 'arabic', maxScore: 50, coefficient: 1, weeklyHours: 5, order: 2 },
  { id: 'sbj-inst-math', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-1', nameAr: 'الرياضيات والحساب', nameFr: 'Calcul & Mathématiques', category: 'scientific', maxScore: 50, coefficient: 1, weeklyHours: 4, order: 3 },
  { id: 'sbj-inst-fr', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-1', nameAr: 'اللغة الفرنسية', nameFr: 'Français', category: 'french', maxScore: 30, coefficient: 1, weeklyHours: 4, order: 4 },
  { id: 'sbj-inst-sci', institutionId: 'institut', sectionId: 'sec-inst-islamic', gradeId: 'grd-inst-1', nameAr: 'العلوم الطبيعية والتكنولوجية', nameFr: 'Sciences Naturelles', category: 'scientific', maxScore: 20, coefficient: 1, weeklyHours: 2, order: 5 },

  // Middle & Secondary subjects with coefficient (الضارب / المعامل)
  { id: 'sbj-sch-math', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-m1', nameAr: 'الرياضيات', nameFr: 'Mathématiques', category: 'scientific', coefficient: 4, weeklyHours: 5, order: 1 },
  { id: 'sbj-sch-ar', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-m1', nameAr: 'اللغة العربية', nameFr: 'Langue Arabe', category: 'arabic', coefficient: 3, weeklyHours: 4, order: 2 },
  { id: 'sbj-sch-fr', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-m1', nameAr: 'اللغة الفرنسية', nameFr: 'Français', category: 'french', coefficient: 3, weeklyHours: 4, order: 3 },
  { id: 'sbj-sch-pc', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-m1', nameAr: 'الفيزياء والكيمياء', nameFr: 'Physique-Chimie', category: 'scientific', coefficient: 3, weeklyHours: 3, order: 4 },
  { id: 'sbj-sch-is', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-m1', nameAr: 'التربية الإسلامية', nameFr: 'Éducation Islamique', category: 'islamic', coefficient: 2, weeklyHours: 2, order: 5 },
  { id: 'sbj-sch-sn', institutionId: 'ecole', sectionId: 'sec-school-general', gradeId: 'grd-sch-m1', nameAr: 'العلوم الطبيعية', nameFr: 'Sciences Naturelles', category: 'scientific', coefficient: 2, weeklyHours: 2, order: 6 }
];

const DEFAULT_FEE_STRUCTURES: FeeStructure[] = [
  { id: 'fs-inst-1', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', gradeId: 'grd-inst-1', registrationFee: 1500, monthlyFee: 2000, transportFee: 800, uniformFee: 500 },
  { id: 'fs-inst-2', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', gradeId: 'grd-inst-2', registrationFee: 1500, monthlyFee: 2000, transportFee: 800, uniformFee: 500 },
  { id: 'fs-inst-3', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', gradeId: 'grd-inst-3', registrationFee: 1500, monthlyFee: 2200, transportFee: 800, uniformFee: 500 },
  { id: 'fs-inst-4', institutionId: 'institut', sectionId: 'sec-inst-islamic', academicYearId: 'year-inst-2025-2026', gradeId: 'grd-inst-4', registrationFee: 1500, monthlyFee: 2200, transportFee: 800, uniformFee: 500 },

  { id: 'fs-sch-5', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', gradeId: 'grd-sch-5', registrationFee: 2000, monthlyFee: 2500, transportFee: 1000, uniformFee: 600 },
  { id: 'fs-sch-6', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', gradeId: 'grd-sch-6', registrationFee: 2000, monthlyFee: 2800, transportFee: 1000, uniformFee: 600 },
  { id: 'fs-sch-m1', institutionId: 'ecole', sectionId: 'sec-school-general', academicYearId: 'year-2025-2026', gradeId: 'grd-sch-m1', registrationFee: 2500, monthlyFee: 3200, transportFee: 1000, uniformFee: 600 }
];

const DEFAULT_GUARDIANS: Guardian[] = [
  {
    id: 'grd-ahmed',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    nameAr: 'أحمد ولد المختار السالم',
    nameFr: 'Ahmed Ould El Mokhtar',
    relationship: 'father',
    phone1: '46450011',
    phone2: '36450011',
    whatsapp: '+22246450011',
    email: 'ahmed.mokhtar@gmail.com',
    address: 'تفرغ زينة - قرب مجمع النخيل',
    profession: 'مهندس اتصالات'
  },
  {
    id: 'grd-fatima',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    nameAr: 'فاطمة منت المصطفى',
    nameFr: 'Fatimetou Mint El Moustapha',
    relationship: 'mother',
    phone1: '48902233',
    whatsapp: '+22248902233',
    address: 'السبخة - الشارع الرئيسي',
    profession: 'أستاذة جامعية'
  },
  {
    id: 'grd-sidi',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    nameAr: 'سيدي محمد ولد البخاري',
    nameFr: 'Sidi Mohamed Ould El Boukhari',
    relationship: 'father',
    phone1: '22334455',
    address: 'عرفات - العمود 11',
    profession: 'تاجر'
  }
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'stu-inst-001',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    gradeId: 'grd-inst-1',
    classId: 'cls-inst-1a',
    guardianId: 'grd-ahmed',
    registrationNumber: 'INS-2026-001',
    rimNumber: 'RIM-88901',
    firstNameAr: 'محمد',
    lastNameAr: 'ولد المختار',
    firstNameFr: 'Mohamed',
    lastNameFr: 'Ould El Mokhtar',
    birthDate: '2019-03-15',
    birthPlace: 'نواكشوط',
    gender: 'male',
    enrollmentDate: '2025-10-02',
    status: 'active',
    exemptionType: 'none',
    createdAt: '2025-10-02T08:00:00Z',
    updatedAt: '2025-10-02T08:00:00Z'
  },
  {
    id: 'stu-inst-002',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    gradeId: 'grd-inst-2',
    classId: 'cls-inst-2a',
    guardianId: 'grd-ahmed', // Brother of Mohamed
    registrationNumber: 'INS-2026-002',
    firstNameAr: 'مريم',
    lastNameAr: 'منت المختار',
    firstNameFr: 'Mariem',
    lastNameFr: 'Mint El Mokhtar',
    birthDate: '2018-05-20',
    birthPlace: 'نواكشوط',
    gender: 'female',
    enrollmentDate: '2025-10-02',
    status: 'active',
    exemptionType: 'brother_discount',
    discountPercentage: 15,
    exemptionReason: 'خصم الأخوة المعتمد من الإدارة',
    exemptionApprovedBy: 'مدير المعهد',
    exemptionApprovalDate: '2025-10-02',
    createdAt: '2025-10-02T08:30:00Z',
    updatedAt: '2025-10-02T08:30:00Z'
  },
  {
    id: 'stu-sch-001',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    gradeId: 'grd-sch-5',
    classId: 'cls-sch-5a',
    guardianId: 'grd-fatima',
    registrationNumber: 'ECL-2026-001',
    firstNameAr: 'إبراهيم',
    lastNameAr: 'ولد الطالب',
    firstNameFr: 'Brahim',
    lastNameFr: 'Ould Taleb',
    birthDate: '2015-09-10',
    birthPlace: 'أطار',
    gender: 'male',
    enrollmentDate: '2025-10-03',
    status: 'active',
    exemptionType: 'none',
    createdAt: '2025-10-03T09:00:00Z',
    updatedAt: '2025-10-03T09:00:00Z'
  },
  {
    id: 'stu-sch-002',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    gradeId: 'grd-sch-6',
    classId: 'cls-sch-6a',
    guardianId: 'grd-sidi',
    registrationNumber: 'ECL-2026-002',
    firstNameAr: 'خديجة',
    lastNameAr: 'منت البخاري',
    firstNameFr: 'Khadija',
    lastNameFr: 'Mint El Boukhari',
    birthDate: '2014-04-12',
    birthPlace: 'نواكشوط',
    gender: 'female',
    enrollmentDate: '2025-10-03',
    status: 'active',
    exemptionType: 'none',
    createdAt: '2025-10-03T09:40:00Z',
    updatedAt: '2025-10-03T09:40:00Z'
  }
];

const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 'tch-inst-1',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    employeeNumber: 'EMP-I-01',
    nameAr: 'الشيخ عبد الله ولد أحمد',
    nameFr: 'Cheikh Abdallahi Ould Ahmed',
    phone: '41223344',
    specialty: 'القرآن الكريم وعلوم الشريعة',
    qualification: 'إجازة في القراءات العشر + متريز شريعة',
    hireDate: '2023-09-15',
    contractType: 'monthly',
    baseSalary: 18000,
    weeklyTargetHours: 20,
    status: 'active'
  },
  {
    id: 'tch-inst-2',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    employeeNumber: 'EMP-I-02',
    nameAr: 'الأستاذة عائشة منت يعقوب',
    nameFr: 'Aichetou Mint Yacoub',
    phone: '47556677',
    specialty: 'اللغة الفرنسية والحساب',
    qualification: 'ليسانس لغات حديثة',
    hireDate: '2024-10-01',
    contractType: 'hourly',
    baseSalary: 0,
    hourlyRate: 350,
    weeklyTargetHours: 14,
    status: 'active'
  },
  {
    id: 'tch-sch-1',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    employeeNumber: 'EMP-E-01',
    nameAr: 'الأستاذ بوبكر ولد سيدي',
    nameFr: 'Boubacar Ould Sidi',
    phone: '49887766',
    specialty: 'الرياضيات والفيزياء',
    qualification: 'ماستر في الرياضيات التطبيقية',
    hireDate: '2022-10-01',
    contractType: 'monthly',
    baseSalary: 22000,
    weeklyTargetHours: 18,
    status: 'active'
  }
];

const DEFAULT_INVOICES: Invoice[] = [
  // Student Mohamed in Institute (1AS)
  {
    id: 'inv-ins-01-reg',
    invoiceNumber: 'INV-2025-001',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-001',
    guardianId: 'grd-ahmed',
    feeCategory: 'registration',
    titleAr: 'رسم التسجيل للسنة 2025-2026',
    titleFr: "Frais d'inscription 2025-2026",
    originalAmount: 1500,
    discountAmount: 0,
    netAmount: 1500,
    paidAmount: 1500,
    remainingAmount: 0,
    dueDate: '2025-10-15',
    status: 'paid',
    createdAt: '2025-10-02T08:00:00Z'
  },
  {
    id: 'inv-ins-01-oct',
    invoiceNumber: 'INV-2025-002',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-001',
    guardianId: 'grd-ahmed',
    monthName: 'أكتوبر 2025',
    feeCategory: 'monthly',
    titleAr: 'القسط الشهري - أكتوبر 2025',
    titleFr: 'Scolarité - Octobre 2025',
    originalAmount: 2000,
    discountAmount: 0,
    netAmount: 2000,
    paidAmount: 2000,
    remainingAmount: 0,
    dueDate: '2025-10-31',
    status: 'paid',
    createdAt: '2025-10-02T08:00:00Z'
  },
  {
    id: 'inv-ins-01-nov',
    invoiceNumber: 'INV-2025-003',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-001',
    guardianId: 'grd-ahmed',
    monthName: 'نوفمبر 2025',
    feeCategory: 'monthly',
    titleAr: 'القسط الشهري - نوفمبر 2025',
    titleFr: 'Scolarité - Novembre 2025',
    originalAmount: 2000,
    discountAmount: 0,
    netAmount: 2000,
    paidAmount: 0,
    remainingAmount: 2000,
    dueDate: '2025-11-30',
    status: 'unpaid',
    createdAt: '2025-11-01T08:00:00Z'
  },

  // Student Mariem in Institute (2AS with 15% brother discount)
  {
    id: 'inv-ins-02-reg',
    invoiceNumber: 'INV-2025-004',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-002',
    guardianId: 'grd-ahmed',
    feeCategory: 'registration',
    titleAr: 'رسم التسجيل للسنة 2025-2026 (خصم إخوة)',
    titleFr: "Frais d'inscription (Réduction Fratrie)",
    originalAmount: 1500,
    discountAmount: 225,
    netAmount: 1275,
    paidAmount: 1275,
    remainingAmount: 0,
    dueDate: '2025-10-15',
    status: 'paid',
    createdAt: '2025-10-02T08:30:00Z'
  },
  {
    id: 'inv-ins-02-oct',
    invoiceNumber: 'INV-2025-005',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-002',
    guardianId: 'grd-ahmed',
    monthName: 'أكتوبر 2025',
    feeCategory: 'monthly',
    titleAr: 'القسط الشهري - أكتوبر 2025 (خصم إخوة 15%)',
    titleFr: 'Scolarité - Octobre 2025 (-15%)',
    originalAmount: 2000,
    discountAmount: 300,
    netAmount: 1700,
    paidAmount: 1700,
    remainingAmount: 0,
    dueDate: '2025-10-31',
    status: 'paid',
    createdAt: '2025-10-02T08:30:00Z'
  },
  {
    id: 'inv-ins-02-nov',
    invoiceNumber: 'INV-2025-006',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-002',
    guardianId: 'grd-ahmed',
    monthName: 'نوفمبر 2025',
    feeCategory: 'monthly',
    titleAr: 'القسط الشهري - نوفمبر 2025 (خصم إخوة 15%)',
    titleFr: 'Scolarité - Novembre 2025 (-15%)',
    originalAmount: 2000,
    discountAmount: 300,
    netAmount: 1700,
    paidAmount: 0,
    remainingAmount: 1700,
    dueDate: '2025-11-30',
    status: 'unpaid',
    createdAt: '2025-11-01T08:00:00Z'
  },

  // Student Brahim in School (5AF)
  {
    id: 'inv-sch-01-reg',
    invoiceNumber: 'INV-E-2025-001',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    studentId: 'stu-sch-001',
    guardianId: 'grd-fatima',
    feeCategory: 'registration',
    titleAr: 'رسم التسجيل للسنة 2025-2026',
    titleFr: "Frais d'inscription 2025-2026",
    originalAmount: 2000,
    discountAmount: 0,
    netAmount: 2000,
    paidAmount: 2000,
    remainingAmount: 0,
    dueDate: '2025-10-15',
    status: 'paid',
    createdAt: '2025-10-03T09:00:00Z'
  },
  {
    id: 'inv-sch-01-oct',
    invoiceNumber: 'INV-E-2025-002',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    studentId: 'stu-sch-001',
    guardianId: 'grd-fatima',
    monthName: 'أكتوبر 2025',
    feeCategory: 'monthly',
    titleAr: 'القسط الشهري - أكتوبر 2025',
    titleFr: 'Scolarité - Octobre 2025',
    originalAmount: 2500,
    discountAmount: 0,
    netAmount: 2500,
    paidAmount: 1500,
    remainingAmount: 1000, // Partial payment
    dueDate: '2025-10-31',
    status: 'partial',
    createdAt: '2025-10-03T09:00:00Z'
  },

  // Student Khadija in School (6AF - Unpaid)
  {
    id: 'inv-sch-02-oct',
    invoiceNumber: 'INV-E-2025-003',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    studentId: 'stu-sch-002',
    guardianId: 'grd-sidi',
    monthName: 'أكتوبر 2025',
    feeCategory: 'monthly',
    titleAr: 'القسط الشهري - أكتوبر 2025',
    titleFr: 'Scolarité - Octobre 2025',
    originalAmount: 2800,
    discountAmount: 0,
    netAmount: 2800,
    paidAmount: 0,
    remainingAmount: 2800,
    dueDate: '2025-10-31',
    status: 'unpaid',
    createdAt: '2025-10-03T09:40:00Z'
  }
];

const DEFAULT_PAYMENTS: PaymentReceipt[] = [
  {
    id: 'rec-ins-01',
    receiptNumber: 'REC-I-2025-000001',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-001',
    guardianId: 'grd-ahmed',
    invoiceIds: ['inv-ins-01-reg', 'inv-ins-01-oct'],
    amountPaid: 3500,
    paymentMethod: 'cash',
    paymentDate: '2025-10-05',
    cashierName: 'أمين الصندوق (المرابط ولد سيدي)',
    cashierId: 'user-cashier-1',
    notes: 'تسديد رسوم التسجيل مع شهر أكتوبر نقداً',
    isCancelled: false,
    createdAt: '2025-10-05T10:15:00Z'
  },
  {
    id: 'rec-ins-02',
    receiptNumber: 'REC-I-2025-000002',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    studentId: 'stu-inst-002',
    guardianId: 'grd-ahmed',
    invoiceIds: ['inv-ins-02-reg', 'inv-ins-02-oct'],
    amountPaid: 2975,
    paymentMethod: 'mobile_payment',
    bankReference: 'BKL-99824312 (Bankily)',
    paymentDate: '2025-10-05',
    cashierName: 'أمين الصندوق (المرابط ولد سيدي)',
    cashierId: 'user-cashier-1',
    notes: 'تحويل عبر تطبيق بنكيلي مع خصم الأخوة المعتمد',
    isCancelled: false,
    createdAt: '2025-10-05T10:25:00Z'
  },
  {
    id: 'rec-sch-01',
    receiptNumber: 'REC-E-2025-000001',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    studentId: 'stu-sch-001',
    guardianId: 'grd-fatima',
    invoiceIds: ['inv-sch-01-reg'],
    amountPaid: 2000,
    paymentMethod: 'cash',
    paymentDate: '2025-10-06',
    cashierName: 'أمين صندوق المدرسة',
    cashierId: 'user-cashier-2',
    notes: 'رسوم التسجيل',
    isCancelled: false,
    createdAt: '2025-10-06T11:00:00Z'
  },
  {
    id: 'rec-sch-02',
    receiptNumber: 'REC-E-2025-000002',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    studentId: 'stu-sch-001',
    guardianId: 'grd-fatima',
    invoiceIds: ['inv-sch-01-oct'],
    amountPaid: 1500,
    paymentMethod: 'cash',
    paymentDate: '2025-10-10',
    cashierName: 'أمين صندوق المدرسة',
    cashierId: 'user-cashier-2',
    notes: 'دفعة أولى من قسط شهر أكتوبر والمتبقي 1000 أوقية',
    isCancelled: false,
    createdAt: '2025-10-10T11:30:00Z'
  }
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-ins-01',
    expenseNumber: 'EXP-I-2025-001',
    institutionId: 'institut',
    sectionId: 'sec-inst-islamic',
    academicYearId: 'year-inst-2025-2026',
    category: 'supplies',
    description: 'شراء مصاحف شريفة وألواح خشبية لتعليم الخط القرآني',
    amount: 1200,
    paymentMethod: 'cash',
    expenseDate: '2025-10-08',
    beneficiary: 'مكتبة النجاح الإسلامية',
    approvedBy: 'مدير المعهد',
    isCancelled: false,
    createdAt: '2025-10-08T14:00:00Z'
  },
  {
    id: 'exp-sch-01',
    expenseNumber: 'EXP-E-2025-001',
    institutionId: 'ecole',
    sectionId: 'sec-school-general',
    academicYearId: 'year-2025-2026',
    category: 'maintenance',
    description: 'صيانة المكيفات وإصلاح مقاعد قاعة الامتحانات',
    amount: 1500,
    paymentMethod: 'cash',
    expenseDate: '2025-10-09',
    beneficiary: 'مؤسسة الأمان للصيانة العامة',
    approvedBy: 'مدير المدرسة',
    isCancelled: false,
    createdAt: '2025-10-09T15:30:00Z'
  }
];

const DEFAULT_CASH_REGISTERS: CashRegisterDay[] = [
  {
    id: 'cr-ins-today',
    institutionId: 'institut',
    date: new Date().toISOString().split('T')[0],
    openingBalance: 5000,
    totalCashIn: 3500,
    totalCashOut: 1200,
    expectedBalance: 7300,
    countedBalance: 7300,
    variance: 0,
    isClosed: false
  },
  {
    id: 'cr-sch-today',
    institutionId: 'ecole',
    date: new Date().toISOString().split('T')[0],
    openingBalance: 10000,
    totalCashIn: 3500,
    totalCashOut: 1500,
    expectedBalance: 12000,
    countedBalance: 12000,
    variance: 0,
    isClosed: false
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-01',
    institutionId: 'institut',
    userId: 'admin-1',
    userName: 'المدير العام (Ecole Bekar)',
    userRole: 'super_admin',
    action: 'create',
    module: 'settings',
    recordId: 'init-setup',
    details: 'تهيئة النظام وتأكيد اقتصار معهد التربية الحديثة على السنوات الأربع الابتدائية فقط',
    timestamp: '2025-10-01T08:00:00Z'
  },
  {
    id: 'aud-02',
    institutionId: 'institut',
    userId: 'cashier-1',
    userName: 'أمين الصندوق (المرابط ولد سيدي)',
    userRole: 'cashier',
    action: 'create',
    module: 'finances',
    recordId: 'rec-ins-01',
    details: 'تسجيل وصل دفع رقم REC-I-2025-000001 بمبلغ 3500 أوقية للتلميذ محمد ولد المختار',
    timestamp: '2025-10-05T10:15:00Z'
  }
];

// Helper to safely load from LocalStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key} from storage:`, err);
    return defaultValue;
  }
}

// Helper to safely save to LocalStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

/**
 * StorageEngine API
 */
export const StorageEngine = {
  // Initialize repository with seed data on first run
  init(): void {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      saveToStorage(STORAGE_KEYS.INSTITUTIONS, DEFAULT_INSTITUTIONS);
      saveToStorage(STORAGE_KEYS.SECTIONS, DEFAULT_SECTIONS);
      saveToStorage(STORAGE_KEYS.ACADEMIC_YEARS, DEFAULT_YEARS);
      saveToStorage(STORAGE_KEYS.GRADES, DEFAULT_GRADES);
      saveToStorage(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
      saveToStorage(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
      saveToStorage(STORAGE_KEYS.FEE_STRUCTURES, DEFAULT_FEE_STRUCTURES);
      saveToStorage(STORAGE_KEYS.GUARDIANS, DEFAULT_GUARDIANS);
      saveToStorage(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
      saveToStorage(STORAGE_KEYS.TEACHERS, DEFAULT_TEACHERS);
      saveToStorage(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
      saveToStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
      saveToStorage(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
      saveToStorage(STORAGE_KEYS.CASH_REGISTERS, DEFAULT_CASH_REGISTERS);
      saveToStorage(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
      saveToStorage(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Auto-migrate: Ensure corrected school names and stages are updated
      const institutions = getFromStorage<Institution[]>(STORAGE_KEYS.INSTITUTIONS, []);
      let instUpdated = false;
      institutions.forEach(inst => {
        if (inst.id === 'ecole') {
          if (inst.nameAr.includes('بيكار') || inst.nameAr === 'مدرسة بيكار الخاصة') {
            inst.nameAr = 'مجمع مدارس بكار الحرة';
            inst.nameFr = 'Complexe des écoles privées BAKAR';
            instUpdated = true;
          }
          if (inst.receiptPrefix !== 'REC-B') {
            inst.receiptPrefix = 'REC-B';
            instUpdated = true;
          }
        }
        if (inst.id === 'institut' && inst.nameAr !== 'معهد التربية الحديثة للعلوم الإسلامية') {
          inst.nameAr = 'معهد التربية الحديثة للعلوم الإسلامية';
          inst.nameFr = 'Institut Moderne des Sciences Islamiques';
          instUpdated = true;
        }
      });
      if (instUpdated) {
        saveToStorage(STORAGE_KEYS.INSTITUTIONS, institutions);
      }

      // Ensure all 4 stages of grades are present for the school
      const existingGrades = getFromStorage<Grade[]>(STORAGE_KEYS.GRADES, []);
      const missingGrades = DEFAULT_GRADES.filter(dg => !existingGrades.some(eg => eg.id === dg.id));
      if (missingGrades.length > 0) {
        saveToStorage(STORAGE_KEYS.GRADES, [...existingGrades, ...missingGrades]);
      }
    }
  },

  // Institutions
  getInstitutions(): Institution[] {
    return getFromStorage<Institution[]>(STORAGE_KEYS.INSTITUTIONS, DEFAULT_INSTITUTIONS);
  },
  saveInstitution(inst: Institution): void {
    const items = this.getInstitutions();
    const idx = items.findIndex(i => i.id === inst.id);
    if (idx >= 0) items[idx] = inst;
    else items.push(inst);
    saveToStorage(STORAGE_KEYS.INSTITUTIONS, items);
  },

  // Sections
  getSections(institutionId?: InstitutionId): Section[] {
    const list = getFromStorage<Section[]>(STORAGE_KEYS.SECTIONS, DEFAULT_SECTIONS);
    return institutionId ? list.filter(s => s.institutionId === institutionId) : list;
  },
  saveSection(section: Section): void {
    const list = this.getSections();
    const idx = list.findIndex(s => s.id === section.id);
    if (idx >= 0) list[idx] = section;
    else list.push(section);
    saveToStorage(STORAGE_KEYS.SECTIONS, list);
  },

  // Academic Years
  getAcademicYears(institutionId?: InstitutionId): AcademicYear[] {
    const list = getFromStorage<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, DEFAULT_YEARS);
    return institutionId ? list.filter(y => y.institutionId === institutionId) : list;
  },
  saveAcademicYear(year: AcademicYear): void {
    const list = this.getAcademicYears();
    const idx = list.findIndex(y => y.id === year.id);
    if (idx >= 0) list[idx] = year;
    else list.push(year);
    saveToStorage(STORAGE_KEYS.ACADEMIC_YEARS, list);
  },

  // Grades (strictly enforce 4 primary years for institute!)
  getGrades(institutionId?: InstitutionId, sectionId?: string): Grade[] {
    let list = getFromStorage<Grade[]>(STORAGE_KEYS.GRADES, DEFAULT_GRADES);
    if (institutionId) {
      list = list.filter(g => g.institutionId === institutionId);
      // Safety check: if institute, verify stage is primary
      if (institutionId === 'institut') {
        list = list.filter(g => g.stage === 'primary' && g.order <= 4);
      }
    }
    if (sectionId && sectionId !== 'all') {
      list = list.filter(g => g.sectionId === sectionId);
    }
    return list.sort((a, b) => a.order - b.order);
  },
  saveGrade(grade: Grade): { success: boolean; message?: string } {
    // ENFORCE RULE: Institute is primary 1 to 4 only
    if (grade.institutionId === 'institut') {
      if (grade.stage !== 'primary' || grade.order > 4 || grade.order < 1) {
        return {
          success: false,
          message: 'معهد التربية الحديثة مخصص حصرياً للسنوات الأربع الابتدائية (من السنة 1 إلى السنة 4)'
        };
      }
    }
    const list = getFromStorage<Grade[]>(STORAGE_KEYS.GRADES, DEFAULT_GRADES);
    const idx = list.findIndex(g => g.id === grade.id);
    if (idx >= 0) list[idx] = grade;
    else list.push(grade);
    saveToStorage(STORAGE_KEYS.GRADES, list);
    return { success: true };
  },
  deleteGrade(id: string): { success: boolean; message?: string } {
    // Check if any class is associated
    const classes = this.getClasses();
    if (classes.some(c => c.gradeId === id)) {
      return { success: false, message: 'لا يمكن حذف المرحلة/السنة نظراً لارتباط فصول دراسية بها. يمكنك أرشفتها بدلاً من ذلك.' };
    }
    let list = getFromStorage<Grade[]>(STORAGE_KEYS.GRADES, DEFAULT_GRADES);
    list = list.filter(g => g.id !== id);
    saveToStorage(STORAGE_KEYS.GRADES, list);
    return { success: true };
  },

  // Classes
  getClasses(institutionId?: InstitutionId, sectionId?: string, gradeId?: string): ClassRoom[] {
    let list = getFromStorage<ClassRoom[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
    if (institutionId) list = list.filter(c => c.institutionId === institutionId);
    if (sectionId && sectionId !== 'all') list = list.filter(c => c.sectionId === sectionId);
    if (gradeId) list = list.filter(c => c.gradeId === gradeId);
    return list;
  },
  saveClass(cls: ClassRoom): void {
    const list = getFromStorage<ClassRoom[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
    const idx = list.findIndex(c => c.id === cls.id);
    if (idx >= 0) list[idx] = cls;
    else list.push(cls);
    saveToStorage(STORAGE_KEYS.CLASSES, list);
  },

  // Subjects
  getSubjects(institutionId?: InstitutionId, sectionId?: string): Subject[] {
    let list = getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    if (institutionId) list = list.filter(s => s.institutionId === institutionId);
    if (sectionId && sectionId !== 'all') list = list.filter(s => s.sectionId === sectionId);
    return list;
  },
  saveSubject(sbj: Subject): void {
    const list = getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    const idx = list.findIndex(s => s.id === sbj.id);
    if (idx >= 0) list[idx] = sbj;
    else list.push(sbj);
    saveToStorage(STORAGE_KEYS.SUBJECTS, list);
  },
  deleteSubject(id: string): { success: boolean } {
    let list = getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    list = list.filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.SUBJECTS, list);
    return { success: true };
  },

  // Timetable Slots (Absolute prohibition of rooms - only class, teacher, subject, day, time)
  getTimetable(institutionId?: InstitutionId, sectionId?: string, classId?: string, teacherId?: string): TimetableSlot[] {
    let list = getFromStorage<TimetableSlot[]>(STORAGE_KEYS.TIMETABLES, []);
    if (institutionId) list = list.filter(t => t.institutionId === institutionId);
    if (sectionId && sectionId !== 'all') list = list.filter(t => t.sectionId === sectionId);
    if (classId) list = list.filter(t => t.classId === classId);
    if (teacherId) list = list.filter(t => t.teacherId === teacherId || t.substituteTeacherId === teacherId);
    return list;
  },
  saveTimetableSlot(slot: TimetableSlot): { success: boolean; message?: string } {
    const list = getFromStorage<TimetableSlot[]>(STORAGE_KEYS.TIMETABLES, []);
    // Conflict detection: teacher at the same day & time
    const teacherConflict = list.find(s =>
      s.id !== slot.id &&
      s.dayOfWeek === slot.dayOfWeek &&
      s.startTime === slot.startTime &&
      (s.teacherId === slot.teacherId || s.substituteTeacherId === slot.teacherId)
    );
    if (teacherConflict) {
      return { success: false, message: 'تعارض في جدول الحصص: الأستاذ مرتبط بحصة أخرى في نفس اليوم والوقت!' };
    }
    // Conflict detection: class at the same day & time
    const classConflict = list.find(s =>
      s.id !== slot.id &&
      s.dayOfWeek === slot.dayOfWeek &&
      s.startTime === slot.startTime &&
      s.classId === slot.classId
    );
    if (classConflict) {
      return { success: false, message: 'تعارض في جدول الحصص: هذا الفصل لديه حصة أخرى مجدولة في نفس التوقيت!' };
    }

    const idx = list.findIndex(s => s.id === slot.id);
    if (idx >= 0) list[idx] = slot;
    else list.push(slot);
    saveToStorage(STORAGE_KEYS.TIMETABLES, list);
    return { success: true };
  },
  deleteTimetableSlot(id: string): void {
    let list = getFromStorage<TimetableSlot[]>(STORAGE_KEYS.TIMETABLES, []);
    list = list.filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.TIMETABLES, list);
  },

  // Fee Structures
  getFeeStructures(institutionId?: InstitutionId, sectionId?: string, gradeId?: string): FeeStructure[] {
    let list = getFromStorage<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, DEFAULT_FEE_STRUCTURES);
    if (institutionId) list = list.filter(f => f.institutionId === institutionId);
    if (sectionId && sectionId !== 'all') list = list.filter(f => f.sectionId === sectionId);
    if (gradeId) list = list.filter(f => f.gradeId === gradeId);
    return list;
  },
  saveFeeStructure(fs: FeeStructure): void {
    const list = getFromStorage<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, DEFAULT_FEE_STRUCTURES);
    const idx = list.findIndex(f => f.id === fs.id);
    if (idx >= 0) list[idx] = fs;
    else list.push(fs);
    saveToStorage(STORAGE_KEYS.FEE_STRUCTURES, list);
  },

  // Guardians
  getGuardians(institutionId?: InstitutionId): Guardian[] {
    const list = getFromStorage<Guardian[]>(STORAGE_KEYS.GUARDIANS, DEFAULT_GUARDIANS);
    return institutionId ? list.filter(g => g.institutionId === institutionId) : list;
  },
  saveGuardian(g: Guardian): void {
    const list = getFromStorage<Guardian[]>(STORAGE_KEYS.GUARDIANS, DEFAULT_GUARDIANS);
    const idx = list.findIndex(item => item.id === g.id);
    if (idx >= 0) list[idx] = g;
    else list.push(g);
    saveToStorage(STORAGE_KEYS.GUARDIANS, list);
  },

  // Students & Enrollment
  getStudents(institutionId?: InstitutionId, sectionId?: string, gradeId?: string, classId?: string): Student[] {
    let list = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    if (institutionId) list = list.filter(s => s.institutionId === institutionId);
    if (sectionId && sectionId !== 'all') list = list.filter(s => s.sectionId === sectionId);
    if (gradeId) list = list.filter(s => s.gradeId === gradeId);
    if (classId) list = list.filter(s => s.classId === classId);
    return list;
  },
  getStudentById(id: string): Student | undefined {
    const list = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    return list.find(s => s.id === id);
  },
  registerStudent(
    studentData: Omit<Student, 'id' | 'registrationNumber' | 'createdAt' | 'updatedAt'>,
    options?: { createInitialInvoices?: boolean }
  ): { student: Student; invoices: Invoice[] } {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const prefix = studentData.institutionId === 'institut' ? 'INS-2026-' : 'ECL-2026-';
    const regSeq = String(students.length + 1).padStart(3, '0');
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      registrationNumber: `${prefix}${regSeq}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    students.push(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, students);

    // Auto-generate invoices from Fee Structure if enabled
    const createdInvoices: Invoice[] = [];
    if (options?.createInitialInvoices !== false) {
      const feePlans = this.getFeeStructures(newStudent.institutionId, newStudent.sectionId, newStudent.gradeId);
      const feePlan = feePlans[0];
      const regFee = newStudent.customRegistrationFee !== undefined ? newStudent.customRegistrationFee : (feePlan?.registrationFee || 1500);
      const monthlyFee = newStudent.customMonthlyFee !== undefined ? newStudent.customMonthlyFee : (feePlan?.monthlyFee || 2000);

      // Apply exemption / discount if any
      let regDiscount = 0;
      let monthlyDiscount = 0;
      if (newStudent.exemptionType === 'full') {
        regDiscount = regFee;
        monthlyDiscount = monthlyFee;
      } else if (newStudent.discountPercentage) {
        regDiscount = Math.round((regFee * newStudent.discountPercentage) / 100);
        monthlyDiscount = Math.round((monthlyFee * newStudent.discountPercentage) / 100);
      } else if (newStudent.discountFixedAmount) {
        monthlyDiscount = Math.min(newStudent.discountFixedAmount, monthlyFee);
      }

      // Registration invoice
      const invReg: Invoice = {
        id: `inv-${Date.now()}-reg`,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        institutionId: newStudent.institutionId,
        sectionId: newStudent.sectionId,
        academicYearId: newStudent.academicYearId,
        studentId: newStudent.id,
        guardianId: newStudent.guardianId,
        feeCategory: 'registration',
        titleAr: `رسم التسجيل للسنة 2025-2026${newStudent.exemptionType !== 'none' ? ' (مستفيد من خصم/إعفاء)' : ''}`,
        titleFr: "Frais d'inscription",
        originalAmount: regFee,
        discountAmount: regDiscount,
        netAmount: regFee - regDiscount,
        paidAmount: 0,
        remainingAmount: regFee - regDiscount,
        dueDate: new Date().toISOString().split('T')[0],
        status: (regFee - regDiscount === 0) ? 'exempted' : 'unpaid',
        createdAt: new Date().toISOString()
      };
      createdInvoices.push(invReg);

      // October monthly fee invoice
      const invMonth: Invoice = {
        id: `inv-${Date.now()}-m1`,
        invoiceNumber: `INV-${(Date.now() + 1).toString().slice(-6)}`,
        institutionId: newStudent.institutionId,
        sectionId: newStudent.sectionId,
        academicYearId: newStudent.academicYearId,
        studentId: newStudent.id,
        guardianId: newStudent.guardianId,
        monthName: 'أكتوبر 2025',
        feeCategory: 'monthly',
        titleAr: `القسط الشهري - أكتوبر 2025${newStudent.exemptionType !== 'none' ? ' (خصم مطبق)' : ''}`,
        titleFr: 'Scolarité - Octobre 2025',
        originalAmount: monthlyFee,
        discountAmount: monthlyDiscount,
        netAmount: monthlyFee - monthlyDiscount,
        paidAmount: 0,
        remainingAmount: monthlyFee - monthlyDiscount,
        dueDate: '2025-10-31',
        status: (monthlyFee - monthlyDiscount === 0) ? 'exempted' : 'unpaid',
        createdAt: new Date().toISOString()
      };
      createdInvoices.push(invMonth);

      const allInvoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
      allInvoices.push(...createdInvoices);
      saveToStorage(STORAGE_KEYS.INVOICES, allInvoices);
    }

    // Log to Audit
    this.addAuditLog({
      institutionId: newStudent.institutionId,
      userId: 'current-user',
      userName: 'المسؤول الإداري',
      userRole: 'super_admin',
      action: 'create',
      module: 'students',
      recordId: newStudent.id,
      details: `تسجيل التلميذ الجديد: ${newStudent.firstNameAr} ${newStudent.lastNameAr} برقم قيد ${newStudent.registrationNumber}`
    });

    return { student: newStudent, invoices: createdInvoices };
  },
  updateStudent(student: Student): void {
    const list = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const idx = list.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      list[idx] = { ...student, updatedAt: new Date().toISOString() };
      saveToStorage(STORAGE_KEYS.STUDENTS, list);
    }
  },
  deleteStudent(studentId: string): boolean {
    const list = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const stu = list.find(s => s.id === studentId);
    if (!stu) return false;
    const remaining = list.filter(s => s.id !== studentId);
    saveToStorage(STORAGE_KEYS.STUDENTS, remaining);

    this.addAuditLog({
      institutionId: stu.institutionId,
      userId: 'current-user',
      userName: 'المسؤول الإداري',
      userRole: 'super_admin',
      action: 'delete',
      module: 'students',
      recordId: studentId,
      details: `حذف ملف التلميذ: ${stu.firstNameAr} ${stu.lastNameAr} (${stu.registrationNumber})`
    });
    return true;
  },
  transferStudentClass(studentId: string, newClassId: string, newGradeId: string): { success: boolean; student?: Student; message?: string } {
    const list = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const stu = list.find(s => s.id === studentId);
    if (!stu) return { success: false, message: 'التلميذ غير موجود' };

    const classes = this.getClasses();
    const oldClass = classes.find(c => c.id === stu.classId);
    const targetClass = classes.find(c => c.id === newClassId);
    const oldClassName = oldClass ? oldClass.nameAr : stu.classId;
    const newClassName = targetClass ? targetClass.nameAr : newClassId;

    stu.classId = newClassId;
    stu.gradeId = newGradeId;
    stu.updatedAt = new Date().toISOString();

    // Recalibrate pending unpaid monthly fees based on new grade fee structure
    const feePlans = this.getFeeStructures(stu.institutionId, stu.sectionId, newGradeId);
    const newPlan = feePlans[0];
    if (newPlan && stu.customMonthlyFee === undefined) {
      const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
      let adjustedCount = 0;
      invoices.forEach(inv => {
        if (inv.studentId === studentId && inv.feeCategory === 'monthly' && inv.status === 'unpaid') {
          let discount = 0;
          if (stu.exemptionType === 'full') {
            discount = newPlan.monthlyFee;
          } else if (stu.discountPercentage) {
            discount = Math.round((newPlan.monthlyFee * stu.discountPercentage) / 100);
          } else if (stu.discountFixedAmount) {
            discount = Math.min(stu.discountFixedAmount, newPlan.monthlyFee);
          }
          inv.originalAmount = newPlan.monthlyFee;
          inv.discountAmount = discount;
          inv.netAmount = newPlan.monthlyFee - discount;
          inv.remainingAmount = inv.netAmount - inv.paidAmount;
          adjustedCount++;
        }
      });
      if (adjustedCount > 0) {
        saveToStorage(STORAGE_KEYS.INVOICES, invoices);
      }
    }

    saveToStorage(STORAGE_KEYS.STUDENTS, list);

    this.addAuditLog({
      institutionId: stu.institutionId,
      userId: 'current-user',
      userName: 'المسؤول الإداري',
      userRole: 'super_admin',
      action: 'update',
      module: 'students',
      recordId: studentId,
      details: `تحويل التلميذ ${stu.firstNameAr} ${stu.lastNameAr} من قسم [${oldClassName}] إلى قسم [${newClassName}] وتحديث الرسوم المستحقة آلياً`
    });

    return { success: true, student: stu };
  },
  bulkUpdateBillableMonths(studentIds: string[], activeMonths: string[]): void {
    const list = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const idSet = new Set(studentIds);
    let updatedCount = 0;
    list.forEach(s => {
      if (idSet.has(s.id)) {
        s.activeBillableMonths = [...activeMonths];
        s.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    });
    saveToStorage(STORAGE_KEYS.STUDENTS, list);
    this.addAuditLog({
      institutionId: 'ecole',
      userId: 'current-user',
      userName: 'المسؤول الإداري',
      userRole: 'super_admin',
      action: 'update',
      module: 'finances',
      recordId: 'bulk-months',
      details: `تحديث جماعي لأشهر الاستحقاق (${activeMonths.join(', ')}) لعدد ${updatedCount} تلميذ`
    });
  },

  // Teachers & Advances
  getTeachers(institutionId?: InstitutionId, sectionId?: string): Teacher[] {
    let list = getFromStorage<Teacher[]>(STORAGE_KEYS.TEACHERS, DEFAULT_TEACHERS);
    if (institutionId) list = list.filter(t => t.institutionId === institutionId);
    if (sectionId && sectionId !== 'all') list = list.filter(t => t.sectionId === sectionId);
    return list;
  },
  saveTeacher(teacher: Teacher): void {
    const list = getFromStorage<Teacher[]>(STORAGE_KEYS.TEACHERS, DEFAULT_TEACHERS);
    const idx = list.findIndex(t => t.id === teacher.id);
    if (idx >= 0) list[idx] = teacher;
    else list.push(teacher);
    saveToStorage(STORAGE_KEYS.TEACHERS, list);
  },

  // Invoices & Student Accounts
  getInvoices(institutionId?: InstitutionId, studentId?: string, monthName?: string): Invoice[] {
    let list = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
    if (institutionId) list = list.filter(i => i.institutionId === institutionId);
    if (studentId) list = list.filter(i => i.studentId === studentId);
    if (monthName && monthName !== 'all') list = list.filter(i => i.monthName === monthName);
    return list;
  },
  saveInvoice(inv: Invoice): void {
    const list = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
    const idx = list.findIndex(i => i.id === inv.id);
    if (idx >= 0) list[idx] = inv;
    else list.push(inv);
    saveToStorage(STORAGE_KEYS.INVOICES, list);
  },

  // Payments & Receipts (ATOMIC OPERATION)
  getPayments(institutionId?: InstitutionId, studentId?: string): PaymentReceipt[] {
    let list = getFromStorage<PaymentReceipt[]>(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
    if (institutionId) list = list.filter(p => p.institutionId === institutionId);
    if (studentId) list = list.filter(p => p.studentId === studentId);
    return list.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  },
  collectPayment(payload: {
    institutionId: InstitutionId;
    sectionId: string;
    academicYearId: string;
    studentId: string;
    guardianId: string;
    amountPaid: number;
    paymentMethod: PaymentReceipt['paymentMethod'];
    bankReference?: string;
    invoiceIds: string[];
    cashierName: string;
    cashierId: string;
    notes?: string;
  }): { success: boolean; receipt?: PaymentReceipt; message?: string } {
    if (payload.amountPaid <= 0) {
      return { success: false, message: 'المبلغ المدفوع يجب أن يكون أكبر من صفر' };
    }

    const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
    const payments = getFromStorage<PaymentReceipt[]>(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
    const inst = this.getInstitutions().find(i => i.id === payload.institutionId);

    // Generate unique sequential receipt number
    const prefix = inst?.receiptPrefix || (payload.institutionId === 'institut' ? 'REC-I' : 'REC-B');
    const seq = String(payments.length + 1).padStart(6, '0');
    const receiptNumber = `${prefix}-${new Date().getFullYear()}-${seq}`;

    // Allocate payment across selected invoices
    let remainingToAllocate = payload.amountPaid;
    for (const invId of payload.invoiceIds) {
      const inv = invoices.find(i => i.id === invId);
      if (inv && inv.remainingAmount > 0 && remainingToAllocate > 0) {
        const canPay = Math.min(inv.remainingAmount, remainingToAllocate);
        inv.paidAmount += canPay;
        inv.remainingAmount -= canPay;
        remainingToAllocate -= canPay;
        inv.status = inv.remainingAmount === 0 ? 'paid' : 'partial';
      }
    }

    const newReceipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber,
      institutionId: payload.institutionId,
      sectionId: payload.sectionId,
      academicYearId: payload.academicYearId,
      studentId: payload.studentId,
      guardianId: payload.guardianId,
      invoiceIds: payload.invoiceIds,
      amountPaid: payload.amountPaid,
      paymentMethod: payload.paymentMethod,
      bankReference: payload.bankReference,
      paymentDate: new Date().toISOString().split('T')[0],
      cashierName: payload.cashierName,
      cashierId: payload.cashierId,
      notes: payload.notes,
      isCancelled: false,
      createdAt: new Date().toISOString()
    };

    payments.unshift(newReceipt);
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);

    // Update Daily Cash Register if cash
    if (payload.paymentMethod === 'cash') {
      this.updateDailyCashRegister(payload.institutionId, payload.amountPaid, 0);
    }

    // Log to Audit
    this.addAuditLog({
      institutionId: payload.institutionId,
      userId: payload.cashierId,
      userName: payload.cashierName,
      userRole: 'cashier',
      action: 'create',
      module: 'finances',
      recordId: newReceipt.id,
      details: `تسجيل وصل قبض رقم ${newReceipt.receiptNumber} بقيمة ${payload.amountPaid} أوقية (${payload.paymentMethod})`
    });

    return { success: true, receipt: newReceipt };
  },
  voidReceipt(receiptId: string, voidReason: string, cashierName: string): { success: boolean; message?: string } {
    const payments = getFromStorage<PaymentReceipt[]>(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
    const receipt = payments.find(p => p.id === receiptId);
    if (!receipt) return { success: false, message: 'الوصل غير موجود' };
    if (receipt.isCancelled) return { success: false, message: 'هذا الوصل ملغى مسبقاً' };

    // Reverse invoices
    const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
    let amountToReverse = receipt.amountPaid;
    for (const invId of receipt.invoiceIds) {
      const inv = invoices.find(i => i.id === invId);
      if (inv && inv.paidAmount > 0 && amountToReverse > 0) {
        const canReverse = Math.min(inv.paidAmount, amountToReverse);
        inv.paidAmount -= canReverse;
        inv.remainingAmount += canReverse;
        amountToReverse -= canReverse;
        inv.status = inv.paidAmount === 0 ? 'unpaid' : 'partial';
      }
    }

    receipt.isCancelled = true;
    receipt.cancelReason = voidReason;
    receipt.cancelledAt = new Date().toISOString();
    receipt.cancelledBy = cashierName;

    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);

    // Update cash register if cash was cancelled
    if (receipt.paymentMethod === 'cash') {
      this.updateDailyCashRegister(receipt.institutionId, -receipt.amountPaid, 0);
    }

    this.addAuditLog({
      institutionId: receipt.institutionId,
      userId: 'current-user',
      userName: cashierName,
      userRole: 'cashier',
      action: 'void',
      module: 'finances',
      recordId: receipt.id,
      details: `إلغاء الوصل رقم ${receipt.receiptNumber} بمبلغ ${receipt.amountPaid} أوقية. السبب: ${voidReason}`
    });

    return { success: true };
  },

  // Expenses
  getExpenses(institutionId?: InstitutionId, sectionId?: string): Expense[] {
    let list = getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
    if (institutionId) list = list.filter(e => e.institutionId === institutionId);
    if (sectionId && sectionId !== 'all') list = list.filter(e => e.sectionId === sectionId);
    return list.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  },
  saveExpense(expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>): Expense {
    const list = getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
    const prefix = expenseData.institutionId === 'institut' ? 'EXP-I' : 'EXP-E';
    const seq = String(list.length + 1).padStart(4, '0');
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      expenseNumber: `${prefix}-${new Date().getFullYear()}-${seq}`,
      createdAt: new Date().toISOString()
    };
    list.unshift(newExp);
    saveToStorage(STORAGE_KEYS.EXPENSES, list);

    if (newExp.paymentMethod === 'cash') {
      this.updateDailyCashRegister(newExp.institutionId, 0, newExp.amount);
    }

    this.addAuditLog({
      institutionId: newExp.institutionId,
      userId: 'current-user',
      userName: newExp.approvedBy,
      userRole: 'accountant',
      action: 'create',
      module: 'finances',
      recordId: newExp.id,
      details: `تسجيل مصروف رقم ${newExp.expenseNumber} بقيمة ${newExp.amount} أوقية (${newExp.category} - ${newExp.description})`
    });

    return newExp;
  },

  // Cash Register Day & Daily Closing
  getCashRegisterToday(institutionId: InstitutionId): CashRegisterDay {
    const today = new Date().toISOString().split('T')[0];
    const list = getFromStorage<CashRegisterDay[]>(STORAGE_KEYS.CASH_REGISTERS, DEFAULT_CASH_REGISTERS);
    let cr = list.find(c => c.institutionId === institutionId && c.date === today);
    if (!cr) {
      // Find yesterday or previous closing
      const prev = list.filter(c => c.institutionId === institutionId).sort((a, b) => b.date.localeCompare(a.date))[0];
      const opening = prev ? (prev.countedBalance || prev.expectedBalance) : 5000;
      cr = {
        id: `cr-${institutionId}-${today}`,
        institutionId,
        date: today,
        openingBalance: opening,
        totalCashIn: 0,
        totalCashOut: 0,
        expectedBalance: opening,
        countedBalance: opening,
        variance: 0,
        isClosed: false
      };
      list.push(cr);
      saveToStorage(STORAGE_KEYS.CASH_REGISTERS, list);
    }
    return cr;
  },
  updateDailyCashRegister(institutionId: InstitutionId, cashInDelta: number, cashOutDelta: number): void {
    const cr = this.getCashRegisterToday(institutionId);
    cr.totalCashIn += cashInDelta;
    cr.totalCashOut += cashOutDelta;
    cr.expectedBalance = cr.openingBalance + cr.totalCashIn - cr.totalCashOut;
    cr.variance = cr.countedBalance - cr.expectedBalance;
    const list = getFromStorage<CashRegisterDay[]>(STORAGE_KEYS.CASH_REGISTERS, DEFAULT_CASH_REGISTERS);
    const idx = list.findIndex(c => c.id === cr.id);
    if (idx >= 0) list[idx] = cr;
    saveToStorage(STORAGE_KEYS.CASH_REGISTERS, list);
  },
  closeCashRegisterDay(institutionId: InstitutionId, countedCash: number, closedBy: string, varianceReason?: string): CashRegisterDay {
    const cr = this.getCashRegisterToday(institutionId);
    cr.countedBalance = countedCash;
    cr.variance = countedCash - cr.expectedBalance;
    cr.varianceReason = varianceReason;
    cr.isClosed = true;
    cr.closedAt = new Date().toISOString();
    cr.closedBy = closedBy;

    const list = getFromStorage<CashRegisterDay[]>(STORAGE_KEYS.CASH_REGISTERS, DEFAULT_CASH_REGISTERS);
    const idx = list.findIndex(c => c.id === cr.id);
    if (idx >= 0) list[idx] = cr;
    saveToStorage(STORAGE_KEYS.CASH_REGISTERS, list);

    this.addAuditLog({
      institutionId,
      userId: 'current-user',
      userName: closedBy,
      userRole: 'cashier',
      action: 'reopen_cashier',
      module: 'finances',
      recordId: cr.id,
      details: `إقفال الصندوق اليومي بتاريخ ${cr.date}: رصيد دفتري ${cr.expectedBalance}، عد فعلي ${cr.countedBalance}، الفارق: ${cr.variance}`
    });

    return cr;
  },

  // Debt Files
  getDebtFiles(institutionId?: InstitutionId): ConsolidatedDebtFile[] {
    const list = getFromStorage<ConsolidatedDebtFile[]>(STORAGE_KEYS.DEBT_FILES, []);
    return institutionId ? list.filter(d => d.institutionId === institutionId) : list;
  },
  saveDebtFile(file: ConsolidatedDebtFile): void {
    const list = this.getDebtFiles();
    const idx = list.findIndex(d => d.id === file.id);
    if (idx >= 0) list[idx] = file;
    else list.unshift(file);
    saveToStorage(STORAGE_KEYS.DEBT_FILES, list);
  },

  // Notifications
  getNotifications(institutionId?: InstitutionId, guardianId?: string): NotificationItem[] {
    let list = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (institutionId) list = list.filter(n => n.institutionId === institutionId);
    if (guardianId) list = list.filter(n => n.guardianId === guardianId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  sendNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'status'>): NotificationItem {
    const list = this.getNotifications();
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    list.unshift(newItem);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, list);
    return newItem;
  },
  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.status = 'read';
      item.readAt = new Date().toISOString();
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  // Audit Logs
  getAuditLogs(institutionId?: InstitutionId): AuditLog[] {
    const list = getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    return institutionId ? list.filter(a => a.institutionId === institutionId) : list;
  },
  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const list = getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    const newLog: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    list.unshift(newLog);
    // Keep max 500 audit logs
    if (list.length > 500) list.pop();
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, list);
  },

  // Student Attendance
  getAttendance(institutionId?: InstitutionId, classId?: string, date?: string): AttendanceRecord[] {
    let list = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    if (institutionId) list = list.filter(a => a.institutionId === institutionId);
    if (classId) list = list.filter(a => a.classId === classId);
    if (date) list = list.filter(a => a.date === date);
    return list;
  },
  saveAttendance(records: AttendanceRecord[]): void {
    const list = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    records.forEach(rec => {
      const idx = list.findIndex(a => a.studentId === rec.studentId && a.date === rec.date);
      if (idx >= 0) list[idx] = rec;
      else list.push(rec);
    });
    saveToStorage(STORAGE_KEYS.ATTENDANCE, list);
  },
  markAllStudentsPresent(
    institutionId: InstitutionId,
    sectionId: string,
    academicYearId: string,
    classId: string,
    date: string,
    studentIds: string[]
  ): void {
    const list = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    studentIds.forEach(stuId => {
      const idx = list.findIndex(a => a.studentId === stuId && a.date === date);
      const record: AttendanceRecord = {
        id: `att-${stuId}-${date}`,
        institutionId,
        sectionId,
        academicYearId,
        classId,
        studentId: stuId,
        date,
        status: 'present'
      };
      if (idx >= 0) list[idx] = record;
      else list.push(record);
    });
    saveToStorage(STORAGE_KEYS.ATTENDANCE, list);
  },

  // Teacher Attendance (POINTAGE الأساتذة)
  getTeacherAttendance(institutionId?: InstitutionId, date?: string): TeacherAttendanceRecord[] {
    let list = getFromStorage<TeacherAttendanceRecord[]>(STORAGE_KEYS.TEACHER_ATTENDANCE, []);
    if (institutionId) list = list.filter(t => t.institutionId === institutionId);
    if (date) list = list.filter(t => t.date === date);
    return list;
  },
  saveTeacherAttendanceRecord(record: TeacherAttendanceRecord): void {
    const list = getFromStorage<TeacherAttendanceRecord[]>(STORAGE_KEYS.TEACHER_ATTENDANCE, []);
    const idx = list.findIndex(t => t.id === record.id || (t.teacherId === record.teacherId && t.date === record.date));
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    saveToStorage(STORAGE_KEYS.TEACHER_ATTENDANCE, list);
  },

  // Student Behavior Notes (السلوك والأخلاق والملاحظات)
  getBehaviorRecords(institutionId?: InstitutionId, studentId?: string): StudentBehaviorRecord[] {
    let list = getFromStorage<StudentBehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR_RECORDS, []);
    if (institutionId) list = list.filter(b => b.institutionId === institutionId);
    if (studentId) list = list.filter(b => b.studentId === studentId);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  saveBehaviorRecord(record: StudentBehaviorRecord): void {
    const list = getFromStorage<StudentBehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR_RECORDS, []);
    const idx = list.findIndex(b => b.id === record.id);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    saveToStorage(STORAGE_KEYS.BEHAVIOR_RECORDS, list);
  },

  // Primary Bulletin & Composition Records
  getPrimaryBulletins(): PrimaryBulletinRecord[] {
    return getFromStorage<PrimaryBulletinRecord[]>(STORAGE_KEYS.BULLETINS, []);
  },
  getPrimaryBulletin(studentId: string, term?: string): PrimaryBulletinRecord | undefined {
    const list = this.getPrimaryBulletins();
    return list.find(b => b.studentId === studentId && (!term || b.term === term));
  },
  savePrimaryBulletin(bulletin: PrimaryBulletinRecord): void {
    const list = this.getPrimaryBulletins();
    const idx = list.findIndex(b => b.id === bulletin.id || (b.studentId === bulletin.studentId && b.term === bulletin.term));
    if (idx >= 0) list[idx] = bulletin;
    else list.push(bulletin);
    saveToStorage(STORAGE_KEYS.BULLETINS, list);
  },

  // Middle & Secondary Bulletins
  getSecondaryBulletins(): SecondaryBulletinRecord[] {
    return getFromStorage<SecondaryBulletinRecord[]>(STORAGE_KEYS.SECONDARY_BULLETINS, []);
  },
  getSecondaryBulletin(studentId: string, term?: string): SecondaryBulletinRecord | undefined {
    const list = this.getSecondaryBulletins();
    return list.find(b => b.studentId === studentId && (!term || b.term === term));
  },
  saveSecondaryBulletin(bulletin: SecondaryBulletinRecord): void {
    const list = this.getSecondaryBulletins();
    const idx = list.findIndex(b => b.id === bulletin.id || (b.studentId === bulletin.studentId && b.term === bulletin.term));
    if (idx >= 0) list[idx] = bulletin;
    else list.push(bulletin);
    saveToStorage(STORAGE_KEYS.SECONDARY_BULLETINS, list);
  },

  // Academic Archiving (أرشفة السنة الدراسية)
  getArchives(): ArchiveRecord[] {
    return getFromStorage<ArchiveRecord[]>(STORAGE_KEYS.ARCHIVES, []);
  },
  archiveAcademicYear(academicYearName: string, institutionId: InstitutionId = 'ecole'): { success: boolean; archiveRecord?: ArchiveRecord; message?: string } {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
    const payments = getFromStorage<PaymentReceipt[]>(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
    const attendance = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const marks = getFromStorage<Mark[]>(STORAGE_KEYS.MARKS, []);

    const targetStudents = students.filter(s => s.institutionId === institutionId);
    const targetInvoices = invoices.filter(i => i.institutionId === institutionId);
    const targetPayments = payments.filter(p => p.institutionId === institutionId);
    const targetAttendance = attendance.filter(a => a.institutionId === institutionId);

    const totalRevenue = targetPayments.filter(p => !p.isCancelled).reduce((sum, p) => sum + p.amountPaid, 0);

    const newArchive: ArchiveRecord = {
      id: `arch-${Date.now()}`,
      academicYear: academicYearName,
      institutionId,
      archivedAt: new Date().toISOString(),
      archivedBy: 'المدير العام',
      studentCount: targetStudents.length,
      invoicesCount: targetInvoices.length,
      paymentsCount: targetPayments.length,
      totalRevenue,
      data: {
        students: targetStudents,
        invoices: targetInvoices,
        payments: targetPayments,
        attendance: targetAttendance,
        marks
      }
    };

    const archives = this.getArchives();
    archives.unshift(newArchive);
    saveToStorage(STORAGE_KEYS.ARCHIVES, archives);

    // Reset active students, invoices, and payments for new school year
    const remainingStudents = students.filter(s => s.institutionId !== institutionId);
    const remainingInvoices = invoices.filter(i => i.institutionId !== institutionId);
    const remainingPayments = payments.filter(p => p.institutionId !== institutionId);
    const remainingAttendance = attendance.filter(a => a.institutionId !== institutionId);

    saveToStorage(STORAGE_KEYS.STUDENTS, remainingStudents);
    saveToStorage(STORAGE_KEYS.INVOICES, remainingInvoices);
    saveToStorage(STORAGE_KEYS.PAYMENTS, remainingPayments);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, remainingAttendance);

    this.addAuditLog({
      institutionId,
      userId: 'admin-1',
      userName: 'المدير العام',
      userRole: 'super_admin',
      action: 'export',
      module: 'settings',
      recordId: newArchive.id,
      details: `تمت أرشفة السنة الدراسية ${academicYearName} بنجاح: تم نقل ${targetStudents.length} ملف تلميذ و${targetPayments.length} وصل بقيمة ${totalRevenue} أوقية إلى الأرشيف وتصفير الجداول النشطة`
    });

    return { success: true, archiveRecord: newArchive };
  },

  // Full Database Backup & Restore (JSON Export)
  exportFullDatabaseJSON(): string {
    const backup: Record<string, any> = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      backup[key] = localStorage.getItem(storageKey);
    }
    return JSON.stringify(backup, null, 2);
  },
  restoreFullDatabaseJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        if (data[key]) {
          localStorage.setItem(storageKey, data[key]);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to restore backup:', err);
      return false;
    }
  }
};
