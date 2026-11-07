/**
 * Ecole Bekar Platform - Main Application Component
 * Private School Management System (Mauritania)
 * Complete integration with full responsive layout, offline persistence,
 * and unified modules.
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { QuickPaymentModal } from './components/finance/QuickPaymentModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentList } from './components/students/StudentList';
import { StudentRostersView } from './components/students/StudentRostersView';
import { AttendanceView } from './components/students/AttendanceView';
import { BehaviorNotesView } from './components/students/BehaviorNotesView';
import { GradesResultsView } from './components/academic/GradesResultsView';
import { AcademicStructure } from './components/academic/AcademicStructure';
import { TeacherList } from './components/teachers/TeacherList';
import { TeacherPointageView } from './components/teachers/TeacherPointageView';
import { GuardiansListView } from './components/guardian/GuardiansListView';
import { AnnualTuitionView } from './components/finance/AnnualTuitionView';
import { PaymentsView } from './components/finance/PaymentsView';
import { FeeTrackingView } from './components/finance/FeeTrackingView';
import { ExpensesCashierView } from './components/finance/ExpensesCashierView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { GuardianPortalView } from './components/guardian/GuardianPortalView';
import { DocumentsView } from './components/documents/DocumentsView';
import { SettingsView } from './components/settings/SettingsView';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeNav, toastMessage } = useApp();

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'students':
        return <StudentList />;
      case 'rosters':
        return <StudentRostersView />;
      case 'attendance':
        return <AttendanceView />;
      case 'behavior':
        return <BehaviorNotesView />;
      case 'grades':
        return <GradesResultsView />;
      case 'academic':
        return <AcademicStructure />;
      case 'teachers':
        return <TeacherList />;
      case 'pointage':
        return <TeacherPointageView />;
      case 'guardians':
        return <GuardiansListView />;
      case 'annualTuition':
        return <AnnualTuitionView />;
      case 'payments':
        return <PaymentsView />;
      case 'feeTracking':
        return <FeeTrackingView />;
      case 'expenses':
        return <ExpensesCashierView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'guardianPortal':
        return <GuardianPortalView />;
      case 'documents':
        return <DocumentsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <Header />

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex w-full">
        <Sidebar />

        {/* Scrollable Main Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Scroll to Top Button */}
      <ScrollToTop />

      {/* Global Modals */}
      <GlobalSearchModal />
      <QuickPaymentModal />

      {/* Global Toast Notification - Top Center */}
      {toastMessage && (
        <div className="no-print fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border backdrop-blur-md pointer-events-auto ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 text-white border-emerald-600/50 shadow-emerald-950/30'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/95 text-white border-rose-600/50 shadow-rose-950/30'
              : 'bg-slate-900/95 text-white border-slate-700/50 shadow-slate-950/30'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}


    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
