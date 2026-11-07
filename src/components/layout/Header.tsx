/**
 * Top Navigation Header for Ecole Bekar
 * Features:
 * - Institution Switcher (المدرسة ⇄ معهد التربية الحديثة للعلوم الإسلامية)
 * - Section Switcher
 * - Offline / Online Status Indicator & Sync Trigger
 * - Global Search (Ctrl+K)
 * - Quick Cashier Action button
 * - Role Switcher Simulator
 * - Language Switcher (AR ⇄ FR)
 * - Mobile Drawer Toggle
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  School,
  Building2,
  Search,
  PlusCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  Bell,
  Menu,
  ChevronDown,
  UserCheck,
  Layers
} from 'lucide-react';
import { UserRole, InstitutionId } from '../../types';

export const Header: React.FC = () => {
  const {
    institutionId,
    setInstitutionId,
    currentInstitution,
    sectionId,
    setSectionId,
    availableSections,
    language,
    setLanguage,
    t,
    userRole,
    setUserRole,
    setMobileMenuOpen,
    setSearchModalOpen,
    setQuickPaymentOpen,
    isOnline,
    syncState,
    triggerSync,
    setActiveNav
  } = useApp();

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left side (in RTL: Right side): Logo + Mobile Toggle + Institution Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Mark */}
          <div
            onClick={() => setActiveNav('dashboard')}
            className="cursor-pointer flex items-center gap-2.5 font-black text-slate-900 tracking-tight"
          >
            {/* Clean logo without card container or border */}
            <img
              src="/assets/aistudio/logo_fe103f4c.png"
              alt="Logo Bekar"
              className="w-10 h-10 object-contain drop-shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="hidden sm:block leading-tight">
              <span className="text-sm font-bold text-slate-900 block">Ecole Bekar</span>
              <span className="text-[11px] text-slate-500 font-normal truncate max-w-[170px] block">
                {currentInstitution.nameAr}
              </span>
            </div>
          </div>

          {/* Institution Switcher (Refined Segmented Control) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setInstitutionId('ecole')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 ${
                institutionId === 'ecole'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>المدرسة</span>
            </button>
            <button
              onClick={() => setInstitutionId('institut')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 ${
                institutionId === 'institut'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate max-w-[130px] sm:max-w-none">معهد التربية الحديثة</span>
            </button>
          </div>

          {/* Section Switcher */}
          {availableSections.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/90 text-xs shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">كل الأقسام</option>
                {availableSections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {language === 'ar' ? sec.nameAr : sec.nameFr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side: Search + Quick Cashier + Offline Indicator + Role + Lang */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/70 rounded-xl border border-slate-200/80 transition-all active:scale-95 shadow-2xs"
            title="بحث شامل (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline font-medium">بحث شامل...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-slate-300 rounded shadow-2xs font-mono text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Cashier Payment Action */}
          <button
            onClick={() => setQuickPaymentOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xs shadow-emerald-900/10 transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">قبض دفعة</span>
          </button>

          {/* Offline / Online & Sync Status */}
          <div className="flex items-center">
            {isOnline ? (
              <button
                onClick={triggerSync}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                title="متصل - انقر للمزامنة اليدوية"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xl:inline">
                  {syncState === 'syncing' ? 'جارِ المزامنة...' : 'متصل ✓'}
                </span>
                <RefreshCw className={`w-3 h-3 text-emerald-600 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
            ) : (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200"
                title="وضع عدم الاتصال: كل التعديلات والدفعات محفوظة محلياً وترفع تلقائياً عند عودة الشبكة"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xl:inline">دون اتصال (محفوظ)</span>
              </div>
            )}
          </div>

          {/* Role Switcher Preview */}
          <div className="relative group hidden sm:block">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-medium text-slate-700 max-w-[110px] truncate">
                {t.roles[userRole] || userRole}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            <div className="absolute left-0 sm:right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                محاكاة صلاحية المستخدم:
              </div>
              {[
                { role: 'super_admin', label: 'المدير العام / مالك النظام' },
                { role: 'school_director', label: 'مدير المدرسة' },
                { role: 'institute_director', label: 'مدير المعهد' },
                { role: 'accountant', label: 'المحاسب' },
                { role: 'cashier', label: 'أمين الصندوق' },
                { role: 'teacher', label: 'الأستاذ' },
                { role: 'guardian', label: 'ولي الأمر (الوكيل)' }
              ].map(item => (
                <button
                  key={item.role}
                  onClick={() => setUserRole(item.role as UserRole)}
                  className={`w-full text-right px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                    userRole === item.role ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{item.label}</span>
                  {userRole === item.role && <span className="text-blue-600">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="تبديل اللغة / Changer de langue"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'ar' ? 'FR' : 'عربي'}</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setActiveNav('notifications')}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="مركز الإشعارات"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
