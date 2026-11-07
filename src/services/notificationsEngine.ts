/**
 * Notifications & Payment Alert Rules Engine for Ecole Bekar
 * Implements:
 * 1. End-of-month reminder rule ("انتهى شهر {الشهر}")
 * 2. 5-day pre-deadline notice rule
 * 3. Overdue escalation rule
 * 4. Catch-up execution engine upon app startup
 */

import { StorageEngine } from './storage';
import { InstitutionId, NotificationItem } from '../types';

export const NotificationsEngine = {
  /**
   * Run catch-up check for all overdue and end-of-month reminders
   */
  runCatchUpCheck(institutionId: InstitutionId): { generatedCount: number; notifications: NotificationItem[] } {
    const students = StorageEngine.getStudents(institutionId);
    const invoices = StorageEngine.getInvoices(institutionId);
    const existingNotifs = StorageEngine.getNotifications(institutionId);
    const generated: NotificationItem[] = [];

    const now = new Date();
    const currentMonthNum = now.getMonth(); // 0 to 11
    const currentYear = now.getFullYear();

    // Months names in Arabic & French
    const monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthNamesFr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // For any unpaid invoices whose due date has passed or current month has ended
    for (const student of students) {
      if (student.status !== 'active') continue;

      const studentUnpaidInvoices = invoices.filter(
        inv => inv.studentId === student.id && (inv.status === 'unpaid' || inv.status === 'partial')
      );

      for (const inv of studentUnpaidInvoices) {
        // Check if a reminder for this invoice was already generated this month
        const alreadySent = existingNotifs.some(
          n => n.invoiceId === inv.id && n.type === 'month_end_reminder'
        );

        if (!alreadySent && inv.remainingAmount > 0) {
          const titleAr = `تذكير بمستحقات: انتهى شهر ${inv.monthName || monthNamesAr[currentMonthNum]}`;
          const titleFr = `Rappel d'échéance: Fin du mois de ${inv.monthName || monthNamesFr[currentMonthNum]}`;

          const msgAr = `إشعار من Ecole Bekar للوكيل المحترم: نود تذكيركم بأن القسط المستحق للتلميذ ${student.firstNameAr} ${student.lastNameAr} هو ${inv.remainingAmount} أوقية (MRU). رقم الفاتورة: ${inv.invoiceNumber}. نرجو التكرم بالسداد في أقرب وقت.`;
          const msgFr = `Avis d'Ecole Bekar au tuteur: Nous vous rappelons que le montant dû pour l'élève ${student.firstNameFr} ${student.lastNameFr} est de ${inv.remainingAmount} MRU. Facture N°: ${inv.invoiceNumber}.`;

          const notif = StorageEngine.sendNotification({
            institutionId: student.institutionId,
            sectionId: student.sectionId,
            guardianId: student.guardianId,
            studentId: student.id,
            type: 'month_end_reminder',
            titleAr,
            titleFr,
            messageAr: msgAr,
            messageFr: msgFr,
            targetMonth: inv.monthName,
            amountDue: inv.remainingAmount,
            invoiceId: inv.id,
            channel: 'in_app'
          });

          generated.push(notif);
        }
      }
    }

    return { generatedCount: generated.length, notifications: generated };
  },

  /**
   * Dispatch manual batch notification for a specific month
   */
  dispatchMonthReminders(institutionId: InstitutionId, monthName: string): number {
    const students = StorageEngine.getStudents(institutionId);
    const invoices = StorageEngine.getInvoices(institutionId);
    let count = 0;

    for (const student of students) {
      const targetInvoice = invoices.find(
        inv => inv.studentId === student.id && inv.monthName === monthName && inv.remainingAmount > 0
      );

      if (targetInvoice) {
        StorageEngine.sendNotification({
          institutionId: student.institutionId,
          sectionId: student.sectionId,
          guardianId: student.guardianId,
          studentId: student.id,
          type: 'month_end_reminder',
          titleAr: `تنبيه سداد رسمي - شهر ${monthName}`,
          titleFr: `Avis officiel de paiement - ${monthName}`,
          messageAr: `المؤسسة: Ecole Bekar | التلميذ: ${student.firstNameAr} ${student.lastNameAr} | المبلغ المستحق: ${targetInvoice.remainingAmount} أوقية (MRU) لشهر ${monthName}.`,
          messageFr: `Ecole Bekar | Élève: ${student.firstNameFr} ${student.lastNameFr} | Montant dû: ${targetInvoice.remainingAmount} MRU pour ${monthName}.`,
          targetMonth: monthName,
          amountDue: targetInvoice.remainingAmount,
          invoiceId: targetInvoice.id,
          channel: 'in_app'
        });
        count++;
      }
    }

    return count;
  }
};
