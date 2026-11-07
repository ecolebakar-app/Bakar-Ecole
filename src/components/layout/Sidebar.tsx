/**
 * Expandable/Collapsible Sidebar Navigation for Ecole Bekar
 * Conforms to the Executive Addendum:
 * Simplified single-screen entries, collapsible with icons & tooltips,
 * responsive mobile drawer, and clear roles.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  CalendarCheck,
  Award,
  Network,
  Users,
  Clock,
  UserCheck,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Wallet,
  BarChart3,
  BellRing,
  HeartHandshake,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    sidebarExpanded,
    setSidebarExpanded,
    mobileMenuOpen,
    setMobileMenuOpen,
    t,
    language,
    institutionId
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'students', label: t.nav.students, icon: GraduationCap },
    { id: 'rosters', label: language === 'ar' ? 'قوائم التلاميذ' : 'Listes des Élèves', icon: ClipboardList },
    { id: 'attendance', label: language === 'ar' ? 'الحضور والغياب' : 'Présence & Absence', icon: CalendarCheck },
    { id: 'behavior', label: language === 'ar' ? 'السلوك والملاحظات' : 'Comportement', icon: Award },
    { id: 'grades', label: language === 'ar' ? 'النتائج وكشوف الدرجات' : 'Notes & Bulletins', icon: Award },
    { id: 'academic', label: t.nav.academic, icon: Network },
    { id: 'teachers', label: t.nav.teachers, icon: Users },
    { id: 'pointage', label: language === 'ar' ? 'POINTAGE الأساتذة' : 'Pointage Enseignants', icon: Clock },
    { id: 'guardians', label: language === 'ar' ? 'الوكلاء وأولياء الأمور' : 'Tuteurs', icon: UserCheck },
    { id: 'annualTuition', label: language === 'ar' ? 'الرسوم السنوية والتسجيل' : 'Scolarité & Inscription', icon: CreditCard },
    { id: 'payments', label: t.nav.payments, icon: Receipt },
    { id: 'feeTracking', label: t.nav.feeTracking, icon: FileSpreadsheet },
    { id: 'expenses', label: t.nav.expenses, icon: Wallet },
    { id: 'reports', label: t.nav.reports, icon: BarChart3 },
    { id: 'notifications', label: t.nav.notifications, icon: BellRing },
    { id: 'guardianPortal', label: t.nav.guardianPortal, icon: HeartHandshake },
    { id: 'documents', label: t.nav.documents, icon: FolderOpen },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#1e1b4b] text-white border-l rtl:border-l-0 rtl:border-r border-indigo-950/40 select-none shadow-2xl rtl:rounded-tl-3xl rtl:rounded-bl-none ltr:rounded-tr-3xl ltr:rounded-br-none overflow-hidden">
      {/* Sidebar Top Section with Logo in white circle & Icon-only Toggle */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Logo in clean white circle */}
          <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/assets/aistudio/logo_fe103f4c.png"
              alt="شعار مجمع مدارس بكار الحرة"
              className="w-7 h-7 object-contain"
            />
          </div>
          {sidebarExpanded && (
            <div className="truncate">
              <span className="text-xs font-black tracking-wide text-white block truncate">مجمع مدارس بكار</span>
              <span className="text-[10px] text-indigo-200/80 font-mono block">BAKAR Schools</span>
            </div>
          )}
        </div>

        {/* Desktop Icon-Only Toggle at Top */}
        <button
          onClick={() => setSidebarExpanded(prev => !prev)}
          className="hidden lg:flex p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title={sidebarExpanded ? 'تصغير' : 'توسيع'}
        >
          {sidebarExpanded ? (
            language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          ) : (
            language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Close button on mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav List with Hidden Scrollbars */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={!sidebarExpanded ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-white text-[#1e1b4b] shadow-md shadow-black/20 font-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-[#1e1b4b]' : 'group-hover:scale-110'}`} />

              {sidebarExpanded && (
                <span className="truncate text-right rtl:text-right ltr:text-left flex-1 tracking-tight text-[11.5px]">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!sidebarExpanded && (
                <div className="absolute right-full rtl:right-full rtl:left-auto ltr:left-full ltr:right-auto ml-2 rtl:mr-2 rtl:ml-0 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-white/10">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar Reaching Full Bottom with Curved Edge */}
      <aside
        className={`no-print hidden lg:block shrink-0 transition-all duration-200 z-20 sticky top-[57px] h-[calc(100vh-57px)] pt-2 pb-0 ${
          sidebarExpanded ? 'w-60' : 'w-18'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 py-2">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
