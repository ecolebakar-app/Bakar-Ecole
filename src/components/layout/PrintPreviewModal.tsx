/**
 * Unified Print Preview & PDF Export Modal for Ecole Bekar
 * Supports A4 / Letter paper layout preview, orientation, zoom, instant print, and PDF export.
 */

import React, { useState } from 'react';
import { Printer, Download, X, ZoomIn, ZoomOut, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { PdfExportService } from '../../services/pdfExportService';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentNumber?: string;
  children: React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  documentNumber,
  children
}) => {
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(10); // 0, 5, 10, 15
  const [zoom, setZoom] = useState(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleExportPdf = async () => {
    const el = document.getElementById('printable-preview-content');
    if (!el) {
      window.print();
      return;
    }
    try {
      setIsExportingPdf(true);
      const cleanName = title.replace(/\s+/g, '_').toLowerCase();
      await PdfExportService.exportElementToPdf(el, {
        fileName: `${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`,
        orientation,
        margin,
        format: paperSize
      });
    } catch (err) {
      console.error('PDF export failed, falling back to window.print', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-slate-100 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:w-full print:rounded-none print:bg-white border border-slate-200">
        {/* Modal Toolbar (hidden during physical print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-slate-200 rounded-t-3xl gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">{title}</h3>
              {documentNumber && (
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5 font-bold">
                  الرقم المرجعي: {documentNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Orientation selector */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${orientation === 'portrait' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="عمودي (Portrait)"
              >
                عمودي
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${orientation === 'landscape' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="أفقي (Landscape)"
              >
                أفقي
              </button>
            </div>

            {/* Margin selector */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
              <span className="text-[10px] text-slate-400 px-1 font-bold">الهامش:</span>
              {[
                { val: 0, label: '0' },
                { val: 5, label: '5mm' },
                { val: 10, label: '10mm' },
                { val: 15, label: '15mm' }
              ].map(m => (
                <button
                  key={m.val}
                  onClick={() => setMargin(m.val)}
                  className={`px-2 py-1 rounded-lg transition-all ${margin === m.val ? 'bg-white shadow-2xs text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                  title={`هامش ${m.label}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Paper Size selector */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
              <button
                onClick={() => setPaperSize('a4')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${paperSize === 'a4' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                A4
              </button>
              <button
                onClick={() => setPaperSize('letter')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${paperSize === 'letter' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Letter
              </button>
            </div>

            {/* Zoom controls */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl text-xs text-slate-600 border border-slate-200">
              <button
                onClick={() => setZoom(prev => Math.max(60, prev - 10))}
                className="hover:text-slate-900 transition-colors p-0.5"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-bold text-[11px] text-slate-800">{zoom}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(140, prev + 10))}
                className="hover:text-slate-900 transition-colors p-0.5"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Save as PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-950/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>تصدير...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تصدير PDF</span>
                </>
              )}
            </button>

            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>طباعة</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/80 print:p-0 print:bg-white">
          <div
            id="printable-preview-content"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              padding: `${margin}mm`
            }}
            className={`w-full bg-white shadow-2xl rounded-sm transition-all print:shadow-none print:p-0 print:transform-none ${
              orientation === 'landscape'
                ? paperSize === 'letter' ? 'max-w-[279mm] min-h-[216mm]' : 'max-w-[297mm] min-h-[210mm]'
                : paperSize === 'letter' ? 'max-w-[216mm] min-h-[279mm]' : 'max-w-[210mm] min-h-[297mm]'
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
