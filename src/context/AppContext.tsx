/**
 * Global Application Context for Ecole Bekar
 * Manages Institution Switcher, Section Switcher, Roles, Language (RTL/LTR),
 * Offline Connectivity, Global Modals, and Reactivity.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InstitutionId, UserRole, Institution, Section } from '../types';
import { StorageEngine } from '../services/storage';
import { ar } from '../locales/ar';
import { fr } from '../locales/fr';

interface AppContextType {
  institutionId: InstitutionId;
  setInstitutionId: (id: InstitutionId) => void;
  currentInstitution: Institution;
  sectionId: string; // 'all' or specific section id
  setSectionId: (id: string) => void;
  availableSections: Section[];
  language: 'ar' | 'fr';
  setLanguage: (lang: 'ar' | 'fr') => void;
  t: typeof ar;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  quickPaymentOpen: boolean;
  setQuickPaymentOpen: (open: boolean) => void;
  isOnline: boolean;
  syncState: 'synced' | 'pending' | 'syncing';
  triggerSync: () => void;
  refreshKey: number;
  reloadAll: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize Storage Engine on mount
  useEffect(() => {
    StorageEngine.init();
  }, []);

  // Institution state (persisted)
  const [institutionId, setInstitutionIdState] = useState<InstitutionId>(() => {
    return (localStorage.getItem('eb_selected_institution') as InstitutionId) || 'ecole';
  });

  const setInstitutionId = (id: InstitutionId) => {
    setInstitutionIdState(id);
    localStorage.setItem('eb_selected_institution', id);
    setSectionId('all'); // reset section on institution change
    reloadAll();
  };

  // Section state
  const [sectionId, setSectionId] = useState<string>('all');

  // Language state (persisted)
  const [language, setLanguageState] = useState<'ar' | 'fr'>(() => {
    return (localStorage.getItem('eb_selected_lang') as 'ar' | 'fr') || 'ar';
  });

  const setLanguage = (lang: 'ar' | 'fr') => {
    setLanguageState(lang);
    localStorage.setItem('eb_selected_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = language === 'ar' ? ar : fr;

  // Role state (for role simulation & access control)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('eb_user_role') as UserRole) || 'super_admin';
  });

  const handleSetRole = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('eb_user_role', role);
    reloadAll();
  };

  // Sidebar expanded state (persisted)
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('eb_sidebar_expanded');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('eb_sidebar_expanded', String(sidebarExpanded));
  }, [sidebarExpanded]);

  // Mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);

  // Active navigation tab
  const [activeNav, setActiveNav] = useState('dashboard');

  // Reactivity trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const reloadAll = () => setRefreshKey(prev => prev + 1);

  // Offline / Online detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<'synced' | 'pending' | 'syncing'>('synced');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState('syncing');
      setTimeout(() => setSyncState('synced'), 1200);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('pending');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Keyboard shortcut for Ctrl+K search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const triggerSync = () => {
    setSyncState('syncing');
    setTimeout(() => {
      setSyncState('synced');
      showToast(language === 'ar' ? 'تمت مزامنة كافة العمليات بنجاح مع السحابة' : 'Toutes les opérations ont été synchronisées avec succès');
    }, 1000);
  };

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Derived current institution & sections
  const institutions = StorageEngine.getInstitutions();
  const currentInstitution = institutions.find(i => i.id === institutionId) || institutions[0];
  const availableSections = StorageEngine.getSections(institutionId);

  return (
    <AppContext.Provider
      value={{
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
        setUserRole: handleSetRole,
        sidebarExpanded,
        setSidebarExpanded,
        mobileMenuOpen,
        setMobileMenuOpen,
        searchModalOpen,
        setSearchModalOpen,
        quickPaymentOpen,
        setQuickPaymentOpen,
        isOnline,
        syncState,
        triggerSync,
        refreshKey,
        reloadAll,
        activeNav,
        setActiveNav,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
