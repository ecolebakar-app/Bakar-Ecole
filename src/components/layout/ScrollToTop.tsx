/**
 * Smooth Scroll-to-Top Button for Ecole Bekar
 * Visible on downward scroll across all pages.
 */

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="no-print fixed bottom-6 left-6 rtl:left-6 rtl:right-auto ltr:right-6 ltr:left-auto z-40 p-3 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 flex items-center justify-center focus:outline-hidden ring-4 ring-slate-900/10"
      title="العودة إلى الأعلى"
      aria-label="العودة إلى الأعلى"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
