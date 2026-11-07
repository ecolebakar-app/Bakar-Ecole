/**
 * Core Type Definitions for Ecole Bekar Platform
 * Private School Management System (Mauritania)
 */

export type InstitutionId = 'ecole' | 'institut';

export type UserRole =
  | 'super_admin'       // مالك النظام / المدير العام
  | 'school_director'   // مدير المدرسة
  | 'institute_director'// مدير المعهد
  | 'academic_director' // المدير الأكاديمي
  | 'accountant'        // المحاسب
  | 'cashier'           // أمين الصندوق
  | 'teacher'           // الأستاذ
  | 'guardian'          // ولي الأمر / الوكيل
  | 'read_only';        // قراءة فقط

export interface Institution {
  id: InstitutionId;
  nameAr: string;
  nameFr: string;
  code: string;
  descriptionAr: string;
  isInstitute: boolean; // if true: strictly primary grades 1 to 4
  phone: string;
  email: string;
  address: string;
  city: string; // Nouakchott, etc.
  moughataa: string; // Tevragh Zeina, Ksar, Arafat, etc.
  receiptPrefix: string;
  currency: string; // 'MRU'
  gradingSystem: '0-20' | '0-10';
  reminderDaysBeforeMonthEnd: number; // default 5
}

export interface Section {
  id: string;
  institutionId: InstitutionId;
  nameAr: string;
  nameFr: string;
  order: number;
}

export interface AcademicYear {
  id: string;
  institutionId: InstitutionId;
  name: string; // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  isActive: boolean;
  isArchived: boolean;
}

export interface Grade {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  nameAr: string;
  nameFr: string; // e.g. "1AS", "2AS" for institute
  code: string;
  order: number;
  stage: 'preschool' | 'primary' | 'middle' | 'secondary'; // School has all 4 stages; Institute is strictly primary 1 to 4
  isActive: boolean;
}

export interface ClassRoom {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  gradeId: string;
  academicYearId: string;
  nameAr: string;
  nameFr: string; // e.g. "1AS-A", "1AS-B"
  capacity: number;
  isActive: boolean;
}

export interface Subject {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  gradeId: string;
  classId?: string; // Optional class-specific subject
  nameAr: string;
  nameFr: string;
  category: 'arabic' | 'french' | 'islamic' | 'scientific' | 'social' | 'other';
  maxScore?: number; // For Primary/Preschool: "المجموع" (e.g. 50, 20, 10)
  coefficient: number; // For Middle/Secondary: "الضارب / المعامل" (e.g. 1, 2, 3, 4)
  weeklyHours: number;
  order?: number;
  teacherId?: string;
}

export interface TimetableSlot {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  substituteTeacherId?: string;
  dayOfWeek: number; // 0: Sunday, 1: Monday, ... 4: Thursday
  startTime: string; // "08:00"
  endTime: string;   // "09:00"
  status: 'scheduled' | 'completed' | 'cancelled' | 'substitute';
  sessionTopicLog?: string; // What was actually taught
}

export interface Student {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  gradeId: string;
  classId: string;
  guardianId: string;
  registrationNumber: string; // auto-generated e.g. "STU-2026-001"
  rimNumber?: string; // Matricule RIM
  nationalId?: string; // NNID
  firstNameAr: string;
  lastNameAr: string;
  firstNameFr: string;
  lastNameFr: string;
  birthDate: string;
  birthPlace: string;
  gender: 'male' | 'female';
  phone?: string;
  address?: string;
  previousSchool?: string;
  enrollmentDate: string;
  photoUrl?: string;
  status: 'active' | 'graduated' | 'transferred' | 'suspended';
  // Financial specifics for this student
  customMonthlyFee?: number; // Director customized amount
  customRegistrationFee?: number;
  feeOverrideReason?: string;
  exemptionType: 'none' | 'full' | 'partial' | 'scholarship' | 'brother_discount';
  discountPercentage?: number;
  discountFixedAmount?: number;
  exemptionReason?: string;
  exemptionApprovedBy?: string;
  exemptionApprovalDate?: string;
  // Active/Billable Months (months student actually studies, non-studied months are exempt with 0 due)
  activeBillableMonths?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Guardian {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  nameAr: string;
  nameFr: string;
  relationship: 'father' | 'mother' | 'guardian' | 'financial_sponsor';
  phone1: string;
  phone2?: string;
  whatsapp?: string;
  email?: string;
  address: string;
  profession?: string;
  nationalId?: string;
}

export interface Teacher {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  employeeNumber: string;
  nameAr: string;
  nameFr: string;
  phone: string;
  email?: string;
  address?: string;
  roleCategory?: 'professor' | 'teacher' | 'staff'; // 'professor' (أساتذة), 'teacher' (معلمون), 'staff' (إداريون وموظفون)
  specialty: string;
  qualification: string;
  hireDate: string;
  contractType: 'hourly' | 'monthly';
  baseSalary: number;
  hourlyRate?: number;
  weeklyTargetHours: number;
  status: 'active' | 'on_leave' | 'resigned';
  photoUrl?: string;
}

export interface TeacherAdvance {
  id: string;
  institutionId: InstitutionId;
  teacherId: string;
  amount: number;
  monthlyDeduction: number;
  remainingAmount: number;
  dateGiven: string;
  status: 'active' | 'paid';
  notes?: string;
}

export interface FeeType {
  id: string;
  institutionId: InstitutionId;
  nameAr: string;
  nameFr: string;
  code: string;
  category: 'registration' | 'monthly' | 'transport' | 'uniform' | 'activity' | 'books' | 'other';
  isRecurringMonthly: boolean;
  isMandatory: boolean;
  canBeDiscounted: boolean;
}

export interface FeeStructure {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  gradeId: string;
  registrationFee: number;
  monthlyFee: number;
  transportFee?: number;
  uniformFee?: number;
  activityFee?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2026-0001
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  studentId: string;
  guardianId: string;
  monthName?: string; // e.g. "أكتوبر" / "Octobre" (for monthly fee)
  feeCategory: 'registration' | 'monthly' | 'transport' | 'other';
  titleAr: string;
  titleFr: string;
  originalAmount: number;
  discountAmount: number;
  netAmount: number; // original - discount
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid' | 'void' | 'exempted';
  voidReason?: string;
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // REC-2026-000001
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  studentId: string;
  guardianId: string;
  invoiceIds: string[];
  amountPaid: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'mobile_payment' | 'other';
  bankReference?: string; // For transfer/cheque or Bankily/Masrvi
  paymentDate: string;
  cashierName: string;
  cashierId: string;
  notes?: string;
  isCancelled: boolean;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string; // EXP-2026-0001
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  category: 'salary' | 'rent' | 'electricity' | 'water' | 'internet' | 'maintenance' | 'supplies' | 'transport' | 'other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque';
  expenseDate: string;
  beneficiary: string;
  invoiceOrReceiptRef?: string;
  approvedBy: string;
  notes?: string;
  isCancelled: boolean;
  cancelReason?: string;
  createdAt: string;
}

export interface CashRegisterDay {
  id: string;
  institutionId: InstitutionId;
  date: string; // YYYY-MM-DD
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedBalance: number; // opening + in - out
  countedBalance: number;
  variance: number; // counted - expected
  varianceReason?: string;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  guardianId: string;
  studentId?: string;
  type: 'month_end_reminder' | 'pre_deadline_notice' | 'payment_received' | 'debt_escalation' | 'general_announcement';
  titleAr: string;
  titleFr: string;
  messageAr: string;
  messageFr: string;
  targetMonth?: string;
  amountDue?: number;
  invoiceId?: string;
  receiptId?: string;
  status: 'pending' | 'sent' | 'read' | 'cancelled';
  channel: 'in_app' | 'fcm' | 'whatsapp' | 'sms';
  createdAt: string;
  sentAt?: string;
  readAt?: string;
}

export interface ConsolidatedDebtFile {
  id: string;
  fileNumber: string; // DEBT-2026-001
  institutionId: InstitutionId;
  sectionId: string;
  monthName: string;
  academicYearId: string;
  totalDebtors: number;
  totalDebtAmount: number;
  items: Array<{
    studentId: string;
    studentName: string;
    guardianName: string;
    guardianPhone: string;
    className: string;
    amountDue: number;
    amountPaid: number;
    amountRemaining: number;
    daysOverdue: number;
    note?: string;
    status: 'pending' | 'collected' | 'promised' | 'deferred' | 'excluded';
    promisedDate?: string;
  }>;
  notes?: string;
  createdAt: string;
  createdByName: string;
}

export interface AttendanceRecord {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  classId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface Exam {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  academicYearId: string;
  gradeId: string;
  classId: string;
  subjectId: string;
  title: string;
  term: 'term_1' | 'term_2' | 'term_3';
  examType: 'controle' | 'examen' | 'final';
  maxScore: number; // 20 or 10
  date: string;
  isLocked: boolean;
}

export interface Mark {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  comments?: string;
}

export interface AuditLog {
  id: string;
  institutionId: InstitutionId;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'create' | 'update' | 'delete' | 'void' | 'export' | 'print' | 'login' | 'reopen_cashier';
  module: 'students' | 'finances' | 'academic' | 'teachers' | 'notifications' | 'settings' | 'auth';
  recordId: string;
  details: string;
  timestamp: string;
}

export interface TeacherAttendanceRecord {
  id: string;
  institutionId: InstitutionId;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // e.g. "07:55"
  checkOutTime?: string; // e.g. "13:30"
  hoursWorked: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  sessionTopic?: string;
  notes?: string;
}

export interface StudentBehaviorRecord {
  id: string;
  institutionId: InstitutionId;
  sectionId: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  type: 'positive' | 'warning' | 'infraction' | 'commendation';
  category: 'attendance' | 'discipline' | 'homework' | 'respect' | 'achievement' | 'other';
  title: string;
  description: string;
  actionTaken?: string;
  guardianNotified: boolean;
  recordedBy: string;
}

export interface PrimarySubjectGrade {
  subjectNameAr: string;
  subjectNameFr: string;
  maxScore: number; // e.g. 50, 20, 10, 30
  compo1: number | null;
  compo2: number | null;
  compo3: number | null;
  average: number | null;
  isFrench?: boolean;
}

export interface PrimaryBulletinRecord {
  id: string;
  studentId: string;
  academicYear: string;
  term: 'term_1' | 'term_2' | 'term_3';
  arabicSubjects: PrimarySubjectGrade[];
  frenchSubjects: PrimarySubjectGrade[];
  totalArabic: number;
  maxArabic: number;
  totalFrench: number;
  maxFrench: number;
  totalGeneral: number;
  maxGeneral: number;
  generalAverage: number;
  rank: number;
  totalStudentsInClass: number;
  absencesCount: number;
  decision: string;
  decisionFr: string;
}

export interface SecondarySubjectGrade {
  subjectNameAr: string;
  subjectNameFr: string;
  devoir?: number | null;
  exam1?: number | null;
  exam2?: number | null;
  exam3?: number | null;
  moyenne: number;
  coefficient: number;
  total: number;
  observation?: string;
}

export interface SecondaryBulletinRecord {
  id: string;
  studentId: string;
  academicYear: string;
  term: 'term_1' | 'term_2' | 'term_3';
  subjects: SecondarySubjectGrade[];
  totalPoints: number;
  totalCoefficients: number;
  moyenneGenerale: number;
  classement: number;
  totalEleves: number;
  absencesNonJustifiees: number;
  absencesJustifiees: number;
  exclusion: number;
  decision: string;
  decisionFr: string;
}

export interface ArchiveRecord {
  id: string;
  academicYear: string;
  institutionId: InstitutionId;
  archivedAt: string;
  archivedBy: string;
  studentCount: number;
  invoicesCount: number;
  paymentsCount: number;
  totalRevenue: number;
  data: {
    students: Student[];
    invoices: Invoice[];
    payments: PaymentReceipt[];
    attendance?: AttendanceRecord[];
    marks?: Mark[];
  };
}
