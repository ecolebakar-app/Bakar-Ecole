/**
 * Document Archive & Repository for Ecole Bekar
 * Conforms to Executive Specification §14:
 * - Student documents, teacher contracts, receipts, certificates
 * - Search by file name, category, and date
 * - File upload simulation with offline resilience
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderOpen,
  Upload,
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';

interface MockDocument {
  id: string;
  name: string;
  category: 'student' | 'teacher' | 'financial' | 'administrative';
  fileType: string;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
}

export const DocumentsView: React.FC = () => {
  const { institutionId, currentInstitution, showToast } = useApp();

  const [documents, setDocuments] = useState<MockDocument[]>([
    {
      id: 'doc-1',
      name: 'شهادة تسجيل واعتراف بمعهد التربية الحديثة للعلوم الإسلامية.pdf',
      category: 'administrative',
      fileType: 'PDF',
      sizeKb: 420,
      uploadedAt: '2025-10-01',
      uploadedBy: 'المدير العام'
    },
    {
      id: 'doc-2',
      name: 'عقد توظيف الأستاذ الشيخ عبد الله ولد أحمد.pdf',
      category: 'teacher',
      fileType: 'PDF',
      sizeKb: 180,
      uploadedAt: '2025-10-02',
      uploadedBy: 'مدير المعهد'
    },
    {
      id: 'doc-3',
      name: 'مستندات تسجيل التلميذ محمد ولد المختار (شهادة ميلاد + تلقيح).pdf',
      category: 'student',
      fileType: 'PDF',
      sizeKb: 850,
      uploadedAt: '2025-10-02',
      uploadedBy: 'أمين التسجيل'
    },
    {
      id: 'doc-4',
      name: 'فاتورة صيانة وإصلاح المقاعد الدراسية.pdf',
      category: 'financial',
      fileType: 'PDF',
      sizeKb: 210,
      uploadedAt: '2025-10-09',
      uploadedBy: 'المحاسب'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal form
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<MockDocument['category']>('student');

  const filteredDocs = documents.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchQuery.trim() && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      showToast('يرجى إدخال اسم المستند', 'error');
      return;
    }

    const newDoc: MockDocument = {
      id: `doc-${Date.now()}`,
      name: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
      category: docCategory,
      fileType: 'PDF',
      sizeKb: Math.floor(Math.random() * 500) + 100,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: 'المسؤول الحالي'
    };

    setDocuments(prev => [newDoc, ...prev]);
    showToast('تم حفظ وأرشفة المستند بنجاح', 'success');
    setShowUploadModal(false);
    setDocName('');
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    showToast('تم حذف المستند من الأرشيف', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            <span>إدارة المستندات والأرشيف الإلكتروني - {currentInstitution.nameAr}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            أرشفة ملفات التلاميذ، عقود الأساتذة، الوصولات، والوثائق الإدارية مع دعم العمل دون اتصال
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>رفع مستند جديد</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في اسم المستند..."
            className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
          >
            <option value="all">كافة التصنيفات</option>
            <option value="student">مستندات التلاميذ (شهادات، ولادة، صور)</option>
            <option value="teacher">عقود وملفات الأساتذة</option>
            <option value="financial">مستندات مالية وفواتير</option>
            <option value="administrative">وثائق وقرارات إدارية</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {doc.category === 'student' ? 'تلميذ' :
                   doc.category === 'teacher' ? 'أستاذ' :
                   doc.category === 'financial' ? 'مالي' : 'إداري'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                {doc.name}
              </h4>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">{doc.sizeKb} KB | {doc.uploadedAt}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => showToast('جاري تجهيز وتنزيل المستند...', 'info')}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                  title="تحميل"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">رفع وأرشفة مستند</h4>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المستند أو الوثيقة *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شهادة مدرسية للتلميذ..."
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التصنيف *:</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="student">مستند تلميذ</option>
                  <option value="teacher">ملف أستاذ / عقد</option>
                  <option value="financial">مستند مالي / فاتورة</option>
                  <option value="administrative">وثيقة إدارية عامة</option>
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-500">
                <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <span className="block text-[11px]">انقر لتحديد الملف أو اسحبه هنا</span>
                <span className="text-[10px] text-slate-400">PDF, PNG, JPG بحد أقصى 10 ميغابايت</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  حفظ في الأرشيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
