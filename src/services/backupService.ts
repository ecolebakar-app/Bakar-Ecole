/**
 * Database Backup & Restore Service (Local Storage / IndexedDB)
 * Allows directors to export complete school academic & financial data as a JSON file,
 * and import/restore backups with validation to ensure high system reliability.
 */

import { StorageEngine } from './storage';

export interface DatabaseBackupPayload {
  version: string;
  exportedAt: string;
  institutionId: string;
  data: Record<string, any>;
}

export const BackupService = {
  /**
   * Export all school database tables as a downloadable JSON file
   */
  exportBackup(institutionId = 'ecole'): void {
    try {
      const allKeys = Object.keys(localStorage);
      const backupData: Record<string, any> = {};

      allKeys.forEach(key => {
        if (key.startsWith('eb_')) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              backupData[key] = JSON.parse(item);
            } catch {
              backupData[key] = item;
            }
          }
        }
      });

      const payload: DatabaseBackupPayload = {
        version: '2.4.0',
        exportedAt: new Date().toISOString(),
        institutionId,
        data: backupData
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `ecole_bekar_backup_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup export failed:', err);
      throw new Error('فشل تصدير النسخة الاحتياطية لقاعدة البيانات');
    }
  },

  /**
   * Import & Restore school database from a JSON file string
   */
  async importBackup(jsonString: string): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const parsed: DatabaseBackupPayload = JSON.parse(jsonString);

      if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف', count: 0 };
      }

      let restoredCount = 0;
      Object.entries(parsed.data).forEach(([key, val]) => {
        if (key.startsWith('eb_')) {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
          restoredCount++;
        }
      });

      return {
        success: true,
        message: `تم استعادة النسخة الاحتياطية بنجاح (${restoredCount} جداول وسجلات بيانات)`,
        count: restoredCount
      };
    } catch (err: any) {
      console.error('Backup import failed:', err);
      return { success: false, message: `خطأ في قراءة ملف النسخة: ${err.message || 'صيغة غير معتمدة'}`, count: 0 };
    }
  }
};
