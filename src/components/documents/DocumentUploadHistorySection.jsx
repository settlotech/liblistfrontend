import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Eye,
  ArrowLeftRight,
  Download,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Search,
  Clock,
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import {
  getDocumentUploadHistory,
  deleteDocumentFromHistory,
  formatBytes
} from '../../services/cloudinaryService';

export default function DocumentUploadHistorySection({
  currentUser = null,
  selectedTemplateId = 'template-standard-policy',
  selectedTemplateName = 'Standard Policy Template',
  onSelectDocumentForCorrection = null,
  onDocIngested = null,
  className = ''
}) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  // Load history strictly filtered to current user
  const loadHistory = () => {
    const list = getDocumentUploadHistory();

    const activeUserId = currentUser?.id || (typeof currentUser === 'string' ? currentUser : null);
    const activeUserName = currentUser?.name || (typeof currentUser === 'string' ? currentUser : null);

    // Filter upload history strictly for current user
    const userDocs = list.filter(doc => {
      if (!activeUserId && !activeUserName) return false;
      const docUid = doc.userId || doc.created_by_user_id || doc.uploaderId;
      const docUname = doc.userName || doc.created_by_user_name || doc.uploaderName || doc.author;
      
      if (activeUserId && docUid && docUid === activeUserId) return true;
      if (activeUserName && docUname && docUname.toLowerCase() === activeUserName.toLowerCase()) return true;
      return false;
    });

    // Also load user-specific approved documents from localStorage
    const approvedDocs = [];
    const approvedStorageKey = `liblist_approved_user_docs_${activeUserId || 'default'}`;
    if (activeUserId || activeUserName) {
      try {
        const raw = localStorage.getItem(approvedStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              const itemUid = item.userId || item.created_by_user_id;
              const itemUname = item.userName || item.created_by_user_name || item.approved_by;
              if (itemUid && activeUserId && itemUid !== activeUserId) return;
              if (!itemUid && activeUserName && itemUname && itemUname.toLowerCase() !== activeUserName.toLowerCase()) return;
              approvedDocs.push({
                id: item.id || `appr-${Date.now()}`,
                name: item.source_file_name || `${item.title}.pdf`,
                originalName: item.source_file_name || `${item.title}.pdf`,
                fileType: (item.source_file_name || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
                sizeFormatted: 'Approved Policy',
                url: item.source_file_url || '',
                uploadedAtFormatted: item.approved_at 
                  ? new Date(item.approved_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : 'Approved',
                status: 'approved',
                approvedBy: item.approved_by || item.created_by_user_name || activeUserName,
                templateName: item.title,
                notes: item.summary,
                userId: activeUserId,
                userName: activeUserName
              });
            });
          }
        }
      } catch (_) {}
    }

    const combined = [...userDocs];
    approvedDocs.forEach(appDoc => {
      if (!combined.some(d => d.id === appDoc.id || d.name === appDoc.name)) {
        combined.unshift(appDoc);
      }
    });

    setHistory(combined);
  };

  useEffect(() => {
    loadHistory();
    const handleUpdate = () => loadHistory();
    window.addEventListener('liblist-doc-history-updated', handleUpdate);
    return () => window.removeEventListener('liblist-doc-history-updated', handleUpdate);
  }, [currentUser]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Remove this document from your upload history?')) {
      const updated = deleteDocumentFromHistory(id);
      loadHistory();
      if (previewDoc && previewDoc.id === id) {
        setPreviewDoc(null);
      }
    }
  };

  const handleCompareInSystem = (doc, e) => {
    e?.stopPropagation();
    navigate('/compare-policy', {
      state: {
        docName: doc.name || doc.originalName,
        pdfUrl: doc.url || doc.secureUrl,
        title: (doc.name || 'Policy Document').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') + ' Operational Policy',
        templateId: doc.templateId || selectedTemplateId,
        sourceDocId: doc.id
      }
    });
  };

  const handleSelectToCorrect = (doc, e) => {
    e?.stopPropagation();
    if (onSelectDocumentForCorrection) {
      onSelectDocumentForCorrection(doc);
    } else {
      handleCompareInSystem(doc);
    }
  };

  const filteredHistory = history.filter(doc => {
    if (!searchQuery.trim()) return true;
    return (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.templateName || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getFileBadge = (type) => {
    switch (type) {
      case 'pdf':
        return { label: 'PDF', bg: 'bg-red-50 text-red-700 border-red-200', icon: FileText };
      case 'docx':
      case 'doc':
        return { label: 'WORD', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText };
      case 'xlsx':
      case 'xls':
      case 'csv':
        return { label: 'SHEET', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet };
      case 'image':
        return { label: 'IMAGE', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: ImageIcon };
      default:
        return { label: 'RAW', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText };
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Uploaded Documents History Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header & Filters */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0057B8]" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              My Uploaded Documents History ({filteredHistory.length})
            </h4>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
              Cloudinary Synced
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#0057B8] w-48 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* List of Documents */}
        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No uploaded documents found for your account.
            </div>
          ) : (
            filteredHistory.map(doc => {
              const badge = getFileBadge(doc.fileType);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={doc.id}
                  className="p-3.5 hover:bg-blue-50/40 transition flex items-center justify-between gap-3 group"
                >
                  {/* Left: File details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600">
                      <BadgeIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {doc.name || doc.originalName}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border uppercase ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {doc.status === 'approved' && (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {(doc.isCloudinarySynced || doc.cloudinarySync) && (
                          <span className="text-[9.5px] font-medium text-[#0057B8] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Cloudinary Synced
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{doc.sizeFormatted || formatBytes(doc.fileSize)}</span>
                        <span>&bull;</span>
                        <span>{doc.uploadedAtFormatted || 'Recent'}</span>
                        {doc.templateName && (
                          <>
                            <span>&bull;</span>
                            <span className="text-slate-600 font-medium truncate max-w-[180px]">
                              {doc.templateName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCompareInSystem(doc, e)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Split-Screen Comparison"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#0057B8]" />
                      <span>Compare</span>
                    </button>

                    {/* Select for AI Parsing & Correction in Modal */}
                    {onSelectDocumentForCorrection && (
                      <button
                        type="button"
                        onClick={(e) => handleSelectToCorrect(doc, e)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Load into Document Editor"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Correct / Ingest</span>
                      </button>
                    )}

                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Open Original Cloud File"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete from History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Preview Modal for History Item */}
      {previewDoc && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0057B8]" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{previewDoc.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Uploaded: {previewDoc.uploadedAtFormatted || 'Recent'} &bull; Size: {previewDoc.sizeFormatted || formatBytes(previewDoc.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onSelectDocumentForCorrection && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSelectToCorrect(previewDoc, e);
                      setPreviewDoc(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open in Policy Editor</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[400px] bg-slate-100 p-2 overflow-hidden flex flex-col">
              {previewDoc.fileType === 'pdf' ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-full border-0 rounded-lg bg-white"
                  title={previewDoc.name}
                />
              ) : (
                <div className="w-full h-full bg-white rounded-lg p-6 overflow-y-auto space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <div className="font-bold text-sm text-[#0057B8] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Document Synchronized on Cloudinary CDN</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      File Format: <strong>{previewDoc.format || previewDoc.fileType}</strong> &bull; Size: <strong>{previewDoc.sizeFormatted || formatBytes(previewDoc.fileSize)}</strong> &bull; Cloud Key: <code>lwddcyps</code>
                    </p>
                    <p className="text-xs text-slate-600">
                      Target Policy Template: <strong>{previewDoc.templateName || 'Standard Policy Template'}</strong>
                    </p>
                  </div>

                  {previewDoc.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      <strong>Template Notes:</strong> {previewDoc.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4">
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Original Asset</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCompareInSystem(previewDoc)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-300"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-[#0057B8]" />
                      <span>Launch Split-Screen Comparison</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
