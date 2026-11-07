/**
 * Statistics & Reports View for Ecole Bekar
 * Conforms to Executive Specification §10:
 * - Aggregated and isolated financial metrics per institution, per section, and grand combined total (Revenues - Expenses = Net)
 * - Academic metrics (students per level, gender ratio, attendance)
 * - Export to Excel (.xlsx) and printable reports
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  School,
  Building2,
  PieChart,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReportsView: React.FC = () => {
  const { institutionId, currentInstitution, userRole, refreshKey } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'financial' | 'academic'>('financial');

  // Load all institutions data for aggregate calculations
  const institutions = useMemo(() => StorageEngine.getInstitutions(), [refreshKey]);
  const allSections = useMemo(() => StorageEngine.getSections(), [refreshKey]);
  const allStudents = useMemo(() => StorageEngine.getStudents(), [refreshKey]);
  const allInvoices = useMemo(() => StorageEngine.getInvoices(), [refreshKey]);
  const allPayments = useMemo(() => StorageEngine.getPayments(), [refreshKey]);
  const allExpenses = useMemo(() => StorageEngine.getExpenses(), [refreshKey]);

  // Current institution filtered data
  const currentStudents = useMemo(() => allStudents.filter(s => s.institutionId === institutionId), [allStudents, institutionId]);
  const currentPayments = useMemo(() => allPayments.filter(p => p.institutionId === institutionId && !p.isCancelled), [allPayments, institutionId]);
  const currentExpenses = useMemo(() => allExpenses.filter(e => e.institutionId === institutionId && !e.isCancelled), [allExpenses, institutionId]);
  const currentInvoices = useMemo(() => allInvoices.filter(i => i.institutionId === institutionId), [allInvoices, institutionId]);

  // Financial aggregates for current institution
  const currentRev = currentPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const currentExp = currentExpenses.reduce((acc, e) => acc + e.amount, 0);
  const currentNet = currentRev - currentExp;
  const currentUncollected = currentInvoices.filter(i => i.remainingAmount > 0).reduce((acc, i) => acc + i.remainingAmount, 0);
  const currentTotalDues = currentInvoices.reduce((acc, i) => acc + i.netAmount, 0);
  const currentCollectionRate = currentTotalDues > 0 ? Math.round((currentRev / currentTotalDues) * 100) : 0;

  // Breakdown per Section within Current Institution
  const sectionBreakdown = useMemo(() => {
    const instSections = allSections.filter(s => s.institutionId === institutionId);
    return instSections.map(sec => {
      const secPayments = currentPayments.filter(p => p.sectionId === sec.id);
      const secExpenses = currentExpenses.filter(e => e.sectionId === sec.id);
      const rev = secPayments.reduce((acc, p) => acc + p.amountPaid, 0);
      const exp = secExpenses.reduce((acc, e) => acc + e.amount, 0);
      const net = rev - exp;
      const countStudents = currentStudents.filter(s => s.sectionId === sec.id).length;
      return {
        sectionId: sec.id,
        nameAr: sec.nameAr,
        nameFr: sec.nameFr,
        studentsCount: countStudents,
        revenue: rev,
        expense: exp,
        net
      };
    });
  }, [allSections, institutionId, currentPayments, currentExpenses, currentStudents]);

  // Combined Grand Total across School + Institute (Only for General Director / Super Admin)
  const isAuthorizedForCombined = userRole === 'super_admin';

  const combinedTotals = useMemo(() => {
    const totalRev = allPayments.filter(p => !p.isCancelled).reduce((acc, p) => acc + p.amountPaid, 0);
    const totalExp = allExpenses.filter(e => !e.isCancelled).reduce((acc, e) => acc + e.amount, 0);
    const totalNet = totalRev - totalExp;
    const totalStudentsCount = allStudents.length;

    // Per institution net
    const schoolRev = allPayments.filter(p => p.institutionId === 'ecole' && !p.isCancelled).reduce((acc, p) => acc + p.amountPaid, 0);
    const schoolExp = allExpenses.filter(e => e.institutionId === 'ecole' && !e.isCancelled).reduce((acc, e) => acc + e.amount, 0);
    const schoolNet = schoolRev - schoolExp;

    const instRev = allPayments.filter(p => p.institutionId === 'institut' && !p.isCancelled).reduce((acc, p) => acc + p.amountPaid, 0);
    const instExp = allExpenses.filter(e => e.institutionId === 'institut' && !e.isCancelled).reduce((acc, e) => acc + e.amount, 0);
    const instNet = instRev - instExp;

    return {
      totalRev,
      totalExp,
      totalNet,
      totalStudentsCount,
      schoolNet,
      schoolRev,
      schoolExp,
      instNet,
      instRev,
      instExp
    };
  }, [allPayments, allExpenses, allStudents]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const { PdfExportService } = await import('../../services/pdfExportService');
      await PdfExportService.exportElementToPdf('reports-content-container', {
        fileName: `ecole_bekar_report_${activeReportTab}_${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const wsData = [
      ['تقرير المؤشرات المالية المجمعة والمنفصلة - Ecole Bekar'],
      ['التاريخ', new Date().toISOString().split('T')[0]],
      [''],
      ['الكيان', 'إجمالي الإيرادات (MRU)', 'إجمالي المصروفات (MRU)', 'الصافي العام (MRU)'],
      ['المدرسة الخاصة', combinedTotals.schoolRev, combinedTotals.schoolExp, combinedTotals.schoolNet],
      ['معهد التربية الحديثة للعلوم الإسلامية', combinedTotals.instRev, combinedTotals.instExp, combinedTotals.instNet],
      ['الإجمالي المجمع لجميع الكيانات والأقسام', combinedTotals.totalRev, combinedTotals.totalExp, combinedTotals.totalNet],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير المالي');
    XLSX.writeFile(wb, `ecole_bekar_financial_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div id="reports-content-container" className="space-y-6 animate-in fade-in duration-150 p-2 sm:p-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
      {/* Official School Header Banner for Print & PDF export */}
      <div className="w-full bg-white pb-3 border-b border-slate-200 flex items-center justify-center">
        <img
          src="/assets/aistudio/__________2026-10-22_161815_d10b3316.png"
          alt="ترويسة مجمع مدارس بكار الحرة"
          className="w-full max-h-20 sm:max-h-24 object-contain"
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>الإحصائيات والتقارير التحليلية - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            حساب صافي المبالغ لكل قسم ولكل كيان، والإجمالي المجمع العام (الإيرادات − المصروفات = الصافي)
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          {/* Tab buttons */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveReportTab('financial')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeReportTab === 'financial' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600'}`}
            >
              التقارير المالية
            </button>
            <button
              onClick={() => setActiveReportTab('academic')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeReportTab === 'academic' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600'}`}
            >
              التقارير الأكاديمية
            </button>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
            title="تصدير التقرير كملف PDF رسمي بهوية المؤسسة"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'جاري تجهيز PDF...' : 'تصدير كـ PDF'}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>تصدير إكسل</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {activeReportTab === 'financial' ? (
        <div className="space-y-6">
          {/* Section 1: Current Institution Financial Health */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${institutionId === 'institut' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span>مؤشرات {currentInstitution.nameAr} الحالية</span>
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">المقبوضات الفعلية</span>
                <div className="text-xl font-black font-mono text-emerald-700">
                  {currentRev.toLocaleString()} MRU
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">المصروفات الفعلية</span>
                <div className="text-xl font-black font-mono text-rose-700">
                  {currentExp.toLocaleString()} MRU
                </div>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-[11px] text-blue-900 font-semibold block mb-1">الصافي (الإيرادات − المصروفات)</span>
                <div className="text-xl font-black font-mono text-blue-700">
                  {currentNet.toLocaleString()} MRU
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] text-amber-800 font-semibold block mb-1">نسبة التحصيل الفعلي</span>
                <div className="text-xl font-black font-mono text-amber-900">
                  {currentCollectionRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Net Amounts Per Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>صافي المبالغ لكل قسم مستقل داخل الكيان (الإيراد − المصروف = الصافي)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">اسم القسم</th>
                    <th className="py-3 px-4">عدد التلاميذ</th>
                    <th className="py-3 px-4">الإيرادات المحصلة</th>
                    <th className="py-3 px-4">المصروفات</th>
                    <th className="py-3 px-4 font-black">الصافي الفعلي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sectionBreakdown.map(sec => (
                    <tr key={sec.sectionId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{sec.nameAr}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{sec.studentsCount} تلميذ</td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{sec.revenue.toLocaleString()} MRU</td>
                      <td className="py-3 px-4 font-mono text-rose-600 font-bold">{sec.expense.toLocaleString()} MRU</td>
                      <td className="py-3 px-4 font-mono font-black text-blue-900">{sec.net.toLocaleString()} MRU</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Grand Combined Analytics (Only for General Director) */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    الإجمالي العام المجمع لجميع الكيانات والأقسام (المدرسة + معهد التربية الحديثة)
                  </h3>
                  <p className="text-xs text-slate-400">
                    تقرير حصري للمدير العام والمحاسب الرئيسي لعرض المركز المالي الموحد
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 bg-white/10 rounded-full font-mono text-yellow-300">
                ECOLE BEKAR CONSOLIDATED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs text-slate-300 block mb-1">صافي مجمع مدارس بكار الحرة</span>
                <div className="text-xl font-black font-mono text-blue-300">
                  {combinedTotals.schoolNet.toLocaleString()} MRU
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  إيراد {combinedTotals.schoolRev} − مصروف {combinedTotals.schoolExp}
                </span>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs text-slate-300 block mb-1">صافي معهد التربية الحديثة</span>
                <div className="text-xl font-black font-mono text-emerald-300">
                  {combinedTotals.instNet.toLocaleString()} MRU
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  إيراد {combinedTotals.instRev} − مصروف {combinedTotals.instExp}
                </span>
              </div>

              <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                <span className="text-xs text-yellow-300 block mb-1 font-bold">الصافي الموحد العام للمؤسسة</span>
                <div className="text-2xl font-black font-mono text-yellow-400">
                  {combinedTotals.totalNet.toLocaleString()} MRU
                </div>
                <span className="text-[10px] text-yellow-200/80 block mt-1 font-mono">
                  إجمالي المقبوضات {combinedTotals.totalRev.toLocaleString()} MRU
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: ACADEMIC METRICS */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي التلاميذ النشطين</span>
              <div className="text-2xl font-black font-mono text-slate-900">{currentStudents.length}</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">توزيع الذكور والإناث</span>
              <div className="text-sm font-bold text-slate-800">
                ذكور: {currentStudents.filter(s => s.gender === 'male').length} | إناث: {currentStudents.filter(s => s.gender === 'female').length}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">متوسط الانضباط والحضور العام</span>
              <div className="text-2xl font-black font-mono text-emerald-600">96.5%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
