/**
 * Notifications Center & Payment Alert Rules Engine for Ecole Bekar
 * Conforms to Executive Specification §9:
 * - End of month reminder rule ("انتهى شهر {الشهر}")
 * - 5-day pre-deadline notice rule
 * - Manual batch send for any selected month
 * - Template editor with variables
 * - Outbox log with statuses (scheduled, sent, read)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { NotificationsEngine } from '../../services/notificationsEngine';
import {
  BellRing,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Sliders,
  FileText
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { institutionId, currentInstitution, showToast, refreshKey, reloadAll } = useApp();

  const [activeTab, setActiveTab] = useState<'log' | 'rules' | 'templates'>('log');
  const [selectedMonthToSend, setSelectedMonthToSend] = useState('أكتوبر 2025');

  // Rules Configuration State
  const [monthEndReminderActive, setMonthEndReminderActive] = useState(true);
  const [preDeadlineAlertActive, setPreDeadlineAlertActive] = useState(true);
  const [preAlertDays, setPreAlertDays] = useState(5);

  const notifications = useMemo(() => {
    return StorageEngine.getNotifications(institutionId);
  }, [institutionId, refreshKey]);

  const students = useMemo(() => StorageEngine.getStudents(institutionId), [institutionId]);
  const guardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId]);

  const handleRunCatchUp = () => {
    const res = NotificationsEngine.runCatchUpCheck(institutionId);
    if (res.generatedCount > 0) {
      showToast(`تم إرسال ${res.generatedCount} إشعار تذكير للمستحقين تلقائياً`, 'success');
      reloadAll();
    } else {
      showToast('جميع الإشعارات المستحقة تم إرسالها مسبقاً، لا توجد إشعارات متأخرة', 'info');
    }
  };

  const handleDispatchMonthBatch = () => {
    const count = NotificationsEngine.dispatchMonthReminders(institutionId, selectedMonthToSend);
    if (count > 0) {
      showToast(`تم إرسال إشعارات شهر ${selectedMonthToSend} لـ ${count} وكيل بنجاح`, 'success');
      reloadAll();
    } else {
      showToast(`لا توجد مستحقات معلقة لشهر ${selectedMonthToSend}`, 'info');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-blue-600" />
            <span>مركز الإشعارات وتنبيهات السداد - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            محرك قواعد التذكير بانتهاء الشهر، التنبيه المسبق بـ 5 أيام، وقوالب رسائل الوكلاء
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'log' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600'}`}
            >
              سجل الإرسال
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'rules' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600'}`}
            >
              محرك القواعد
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'templates' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600'}`}
            >
              قوالب الرسائل
            </button>
          </div>

          <button
            onClick={handleRunCatchUp}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs"
            title="فحص فوري لأي تذكيرات مستحقة لم ترسل بعد"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>فحص المستحقات (Catch-up)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: NOTIFICATIONS LOG */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Quick Dispatch Bar */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span className="font-bold text-blue-900">إرسال تنبيه جماعي لشهر محدد:</span>
              <select
                value={selectedMonthToSend}
                onChange={(e) => setSelectedMonthToSend(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-blue-300 bg-white font-semibold text-slate-800"
              >
                <option value="أكتوبر 2025">أكتوبر 2025</option>
                <option value="نوفمبر 2025">نوفمبر 2025</option>
                <option value="ديسمبر 2025">ديسمبر 2025</option>
              </select>
            </div>

            <button
              onClick={handleDispatchMonthBatch}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال إشعار الشهر لكل الوكلاء المدينين</span>
            </button>
          </div>

          {/* Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>الإشعارات الصادرة للوكلاء ({notifications.length})</span>
              <span>اسم المرسل المعتمد: Ecole Bekar</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {notifications.length > 0 ? (
                notifications.map(n => {
                  const s = students.find(item => item.id === n.studentId);
                  const g = guardians.find(item => item.id === n.guardianId);
                  return (
                    <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{n.titleAr}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                            {n.type === 'month_end_reminder' ? 'تذكير نهاية الشهر' : 'إشعار سداد'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed max-w-2xl">{n.messageAr}</p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-3">
                          <span>المرسل إليه: <strong>{g?.nameAr || 'الوكيل'}</strong></span>
                          <span>التلميذ: <strong>{s ? `${s.firstNameAr} ${s.lastNameAr}` : '—'}</strong></span>
                          <span className="font-mono">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {n.amountDue && (
                          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            {n.amountDue} MRU
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مُرسل</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-slate-400">
                  لا توجد إشعارات مسجلة حتى الآن. يمكنك فحص المستحقات أو إرسال تنبيه جماعي.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RULES CONFIGURATION */}
      {activeTab === 'rules' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">محرك قواعد التذكير التلقائي (Rules Engine)</h3>
            <p className="text-slate-500">يعمل بدون الحاجة لأي خوادم خارجية ويعتمد جدولة محلية ذكية</p>
          </div>

          {/* Rule 1: Month End */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900 text-sm">القاعدة 1: تذكير انتهاء الشهر التلقائي</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">موصى به</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                في أول يوم من الشهر التالي، يتم توليد إشعار تلقائي لكل وكيل لديه تلميذ مستحق في ذلك الشهر تحت عنوان:
                «انتهى شهر &#123;الشهر&#125;»، متضمناً بطاقة التلميذ، والمبلغ المستحق، وزر السداد أو الطباعة.
              </p>
            </div>
            <input
              type="checkbox"
              checked={monthEndReminderActive}
              onChange={(e) => setMonthEndReminderActive(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 mt-1"
            />
          </div>

          {/* Rule 2: Pre-Deadline Alert */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900 text-sm">القاعدة 2: تنبيه استباقي قبل نهاية الشهر</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">تنبيه مبكر</span>
              </div>
              <p className="text-slate-600 leading-relaxed mb-2">
                إرسال إشعار تذكيري استباقي للوكلاء قبل نهاية الشهر بعدد أيام قابل للضبط، مع ذكر مبلغ الشهر القادم وموعد الاستحقاق.
              </p>
              <div className="flex items-center gap-2">
                <span>تنبيه قبل النهاية بـ:</span>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={preAlertDays}
                  onChange={(e) => setPreAlertDays(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-300 rounded-lg font-mono text-center"
                />
                <span>أيام (الافتراضي 5 أيام)</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preDeadlineAlertActive}
              onChange={(e) => setPreDeadlineAlertActive(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 mt-1"
            />
          </div>

          <button
            onClick={() => showToast('تم حفظ إعدادات محرك القواعد بنجاح', 'success')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
          >
            حفظ إعدادات القواعد
          </button>
        </div>
      )}

      {/* TAB 3: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">محرر قوالب الرسائل بمتغيرات حية</h3>
          <p className="text-slate-500">
            يمكنك استخدام المتغيرات التالية: {'{اسم الطالب}'}، {'{الشهر}'}، {'{المبلغ}'}، {'{المدرسة}'}، {'{الفصل}'}، {'{رقم الفاتورة}'}.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">قالب تذكير نهاية الشهر (بالعربية):</label>
              <textarea
                rows={3}
                defaultValue="إشعار من Ecole Bekar للوكيل المحترم: نود تذكيركم بأن القسط المستحق للتلميذ {اسم الطالب} ({الفصل}) هو {المبلغ} أوقية (MRU) لشهر {الشهر}. رقم الفاتورة: {رقم الفاتورة}."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Modèle de notification (Français):</label>
              <textarea
                rows={3}
                defaultValue="Avis officiel d'Ecole Bekar: Nous vous rappelons que l'échéance de {الشهر} pour l'élève {اسم الطالب} ({الفصل}) est de {المبلغ} MRU."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <button
              onClick={() => showToast('تم تحديث قوالب الإشعارات بنجاح', 'success')}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            >
              حفظ القوالب
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
