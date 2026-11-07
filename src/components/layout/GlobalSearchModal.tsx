/**
 * Global Search Dialog (Ctrl+K) for Ecole Bekar
 * Instant search-as-you-type across Students, Guardians, Teachers, Invoices, Receipts, and Classes.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageEngine } from '../../services/storage';
import { Search, X, GraduationCap, Users, User, Receipt, FileText, ArrowRight } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const { searchModalOpen, setSearchModalOpen, institutionId, setActiveNav } = useApp();
  const [query, setQuery] = useState('');

  const students = useMemo(() => StorageEngine.getStudents(institutionId), [institutionId, searchModalOpen]);
  const guardians = useMemo(() => StorageEngine.getGuardians(institutionId), [institutionId, searchModalOpen]);
  const teachers = useMemo(() => StorageEngine.getTeachers(institutionId), [institutionId, searchModalOpen]);
  const payments = useMemo(() => StorageEngine.getPayments(institutionId), [institutionId, searchModalOpen]);
  const classes = useMemo(() => StorageEngine.getClasses(institutionId), [institutionId, searchModalOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const q = query.toLowerCase().trim();
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'student' | 'guardian' | 'teacher' | 'receipt' | 'class';
      targetNav: string;
    }> = [];

    // Search students
    for (const s of students) {
      if (
        s.firstNameAr.includes(q) ||
        s.lastNameAr.includes(q) ||
        s.firstNameFr.toLowerCase().includes(q) ||
        s.lastNameFr.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q)
      ) {
        results.push({
          id: s.id,
          title: `${s.firstNameAr} ${s.lastNameAr}`,
          subtitle: `تلميذ مسجل بالمؤسسة`,
          category: 'student',
          targetNav: 'students'
        });
      }
    }

    // Search guardians
    for (const g of guardians) {
      if (
        g.nameAr.includes(q) ||
        g.nameFr.toLowerCase().includes(q) ||
        g.phone1.includes(q)
      ) {
        results.push({
          id: g.id,
          title: `${g.nameAr} (${g.phone1})`,
          subtitle: `ولي أمر / وكيل - صلة القرابة: ${g.relationship}`,
          category: 'guardian',
          targetNav: 'students'
        });
      }
    }

    // Search teachers
    for (const t of teachers) {
      if (
        t.nameAr.includes(q) ||
        t.nameFr.toLowerCase().includes(q) ||
        t.specialty.includes(q)
      ) {
        results.push({
          id: t.id,
          title: t.nameAr,
          subtitle: `أستاذ - التخصص: ${t.specialty}`,
          category: 'teacher',
          targetNav: 'teachers'
        });
      }
    }

    // Search receipts
    for (const p of payments) {
      if (p.receiptNumber.toLowerCase().includes(q)) {
        results.push({
          id: p.id,
          title: `وصل قبض: ${p.receiptNumber}`,
          subtitle: `المبلغ: ${p.amountPaid} أوقية - التاريخ: ${p.paymentDate}`,
          category: 'receipt',
          targetNav: 'payments'
        });
      }
    }

    // Search classes
    for (const c of classes) {
      if (c.nameAr.includes(q) || c.nameFr.toLowerCase().includes(q)) {
        results.push({
          id: c.id,
          title: `فصل: ${c.nameAr}`,
          subtitle: `السعة: ${c.capacity} مقعد`,
          category: 'class',
          targetNav: 'academic'
        });
      }
    }

    return results.slice(0, 10);
  }, [query, students, guardians, teachers, payments, classes]);

  if (!searchModalOpen) return null;

  const handleSelect = (nav: string) => {
    setActiveNav(nav);
    setSearchModalOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن تلميذ، وكيل، أستاذ، رقم وصل، أو فصل دراسي..."
            className="w-full py-4 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchModalOpen(false)}
            className="ml-2 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-md"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {searchResults.length > 0 ? (
            searchResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.targetNav)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.category === 'student' ? 'bg-blue-50 text-blue-600' :
                    item.category === 'guardian' ? 'bg-indigo-50 text-indigo-600' :
                    item.category === 'teacher' ? 'bg-emerald-50 text-emerald-600' :
                    item.category === 'receipt' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.category === 'student' && <GraduationCap className="w-4 h-4" />}
                    {item.category === 'guardian' && <User className="w-4 h-4" />}
                    {item.category === 'teacher' && <Users className="w-4 h-4" />}
                    {item.category === 'receipt' && <Receipt className="w-4 h-4" />}
                    {item.category === 'class' && <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            ))
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              لم يتم العثور على أي نتائج مطابقة لـ "{query}"
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              اكتب حرفين على الأقل للبحث السريع في كافة سجلات المؤسسة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
