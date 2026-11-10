import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    FileText,
    UploadCloud,
    BookOpen,
    CheckCircle2,
    Loader2,
    Layers,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import LibrarySearchSelect from './LibrarySearchSelect';

export default function NewDocumentModal({
    isOpen,
    onClose,
    libraries = [],
    preselectedLibraryId = null,
    onDocumentCreated
}) {
    // 3 Tabs: 'direct_in_system' | 'master_library' | 'document_uploads'
    const [activeTab, setActiveTab] = useState('direct_in_system');

    // Shared Form State
    const [libraryId, setLibraryId] = useState(preselectedLibraryId || '');
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('policy');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Tab 2: Master Library Templates State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);

    // Tab 3: Document Uploads State (Real PDF Parser Pipeline)
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStage, setUploadStage] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'ready_for_review' | 'confirmed'
    const [jobId, setJobId] = useState(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [extractedSections, setExtractedSections] = useState([]);
    const pollIntervalRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (preselectedLibraryId) {
            setLibraryId(preselectedLibraryId);
        } else if (libraries.length > 0 && !libraryId) {
            setLibraryId(libraries[0].id);
        }
    }, [preselectedLibraryId, libraries]);

    // Load templates if switching to master_library tab
    useEffect(() => {
        if (activeTab === 'master_library' && templates.length === 0) {
            documentManagementApi.getTemplates().then((res) => {
                if (res?.data) {
                    setTemplates(res.data);
                } else {
                    setTemplates([
                        {
                            id: 'tmpl-apra-cps-234',
                            template_name: 'APRA CPS 234 Information Security Standard',
                            category: 'Information Security',
                            description: 'Comprehensive cybersecurity controls, asset classification, and incident management framework.'
                        },
                        {
                            id: 'tmpl-aml-ctf-2026',
                            template_name: 'AML / CTF Transaction Monitoring & Screening Policy',
                            category: 'Financial Crime',
                            description: 'Anti-Money Laundering framework, threshold reporting, and customer due diligence.'
                        },
                        {
                            id: 'tmpl-credit-risk-retail',
                            template_name: 'Retail Lending & Credit Card Underwriting Policy',
                            category: 'Credit Risk',
                            description: 'Credit scoring criteria, limit approval matrices, and arrears handling procedures.'
                        }
                    ]);
                }
            }).catch(() => {});
        }
    }, [activeTab, templates.length]);

    // Clean up poll interval on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    if (!isOpen) return null;

    // ── Tab 1: Direct-in System Creation ──
    const handleDirectSubmit = async (e) => {
        e.preventDefault();
        if (!documentName.trim() || !libraryId) {
            setErrorMsg('Document name and target library are required.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const res = await documentManagementApi.createDocument({
                library_id: libraryId,
                document_name: documentName.trim(),
                document_type: documentType,
                description: description.trim(),
                source_type: 'manual'
            });

            if (res.success && res.data) {
                // Add initial section
                await documentManagementApi.createSection({
                    document_id: res.data.id,
                    section_title: 'Overview & Objectives',
                    section_number: '1.0',
                    section_order: 0,
                    content: { text: description || 'This document defines the core operational standards.' }
                }).catch(() => {});

                window.dispatchEvent(new CustomEvent('liblist:document-created', { detail: res.data }));
                if (onDocumentCreated) onDocumentCreated(res.data);
                onClose();
            } else {
                setErrorMsg(res.message || 'Failed to create document.');
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred during document creation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Tab 2: Master Library Template Instantiation ──
    const handleTemplateSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTemplateId || !libraryId) {
            setErrorMsg('Please select a template and destination library.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const selectedTmpl = templates.find((t) => t.id === selectedTemplateId);
            const docName = documentName.trim() || selectedTmpl?.template_name || 'Standard Operational Policy';

            const res = await documentManagementApi.applyTemplate(selectedTemplateId, libraryId, docName).catch(async () => {
                return documentManagementApi.createDocument({
                    library_id: libraryId,
                    document_name: docName,
                    document_type: 'policy',
                    description: selectedTmpl?.description || '',
                    source_type: 'template'
                });
            });

            if (res?.data) {
                window.dispatchEvent(new CustomEvent('liblist:document-created', { detail: res.data }));
                if (onDocumentCreated) onDocumentCreated(res.data);
                onClose();
            }
        } catch (err) {
            setErrorMsg(err.message || 'Failed to apply template.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Tab 3: Real PDF Upload & Processing Pipeline ──
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (!documentName) {
                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                setDocumentName(cleanName);
            }
        }
    };

    const handleStartUpload = async () => {
        if (!selectedFile || !libraryId) {
            setErrorMsg('Please select a file and target library.');
            return;
        }

        setIsSubmitting(true);
        setUploadStage('uploading');
        setProgressPercent(20);
        setErrorMsg('');

        try {
            const res = await documentManagementApi.uploadPdfForImport(
                libraryId,
                selectedFile,
                documentName.trim() || selectedFile.name
            );

            if (res?.data?.job_id) {
                const jId = res.data.job_id;
                setJobId(jId);
                setUploadStage('processing');
                setProgressPercent(40);

                pollIntervalRef.current = setInterval(async () => {
                    try {
                        const jobRes = await documentManagementApi.getImportJobStatus(jId);
                        const job = jobRes?.data;
                        if (job) {
                            setProgressPercent(job.progress_percent || 60);

                            if (job.status === 'completed' || job.processing_stage === 'ready_for_review') {
                                clearInterval(pollIntervalRef.current);
                                setUploadStage('ready_for_review');
                                setProgressPercent(100);
                                setExtractedSections(job.extracted_structure?.sections || []);
                            } else if (job.status === 'failed') {
                                clearInterval(pollIntervalRef.current);
                                setUploadStage('failed');
                                setErrorMsg(job.error_message || 'PDF extraction failed.');
                            }
                        }
                    } catch (pollErr) {
                        console.error('Polling error:', pollErr);
                    }
                }, 1200);
            }
        } catch (err) {
            setUploadStage('idle');
            setErrorMsg(err.message || 'File upload failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!jobId) return;
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const res = await documentManagementApi.confirmImportedSections(jobId, extractedSections);
            if (res.success && res.data?.document) {
                window.dispatchEvent(new CustomEvent('liblist:document-created', { detail: res.data.document }));
                if (onDocumentCreated) onDocumentCreated(res.data.document);
                onClose();
            } else {
                setErrorMsg(res.message || 'Failed to materialize sections.');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Error finalizing imported document.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dms-modal-overlay">
            <div className="dms-modal-card" style={{ maxWidth: '640px' }}>
                <div className="dms-modal-header">
                    <h3 className="dms-modal-title">Create or Ingest New Document</h3>
                    <button
                        type="button"
                        className="dms-annot-close-btn"
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* 3 Creation Tabs */}
                <div className="dms-creation-tabs">
                    <button
                        type="button"
                        className={`dms-creation-tab-btn ${activeTab === 'direct_in_system' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('direct_in_system'); setErrorMsg(''); }}
                    >
                        <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Direct-in system
                    </button>
                    <button
                        type="button"
                        className={`dms-creation-tab-btn ${activeTab === 'master_library' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('master_library'); setErrorMsg(''); }}
                    >
                        <BookOpen size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Master library
                    </button>
                    <button
                        type="button"
                        className={`dms-creation-tab-btn ${activeTab === 'document_uploads' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('document_uploads'); setErrorMsg(''); }}
                    >
                        <UploadCloud size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Document uploads
                    </button>
                </div>

                {errorMsg && (
                    <div style={{ margin: '0 20px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={15} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* TAB 1: DIRECT-IN SYSTEM */}
                {activeTab === 'direct_in_system' && (
                    <form onSubmit={handleDirectSubmit}>
                        <div className="dms-modal-body">
                            {/* Searchable Target Library */}
                            <div className="dms-form-group">
                                <label className="dms-form-label">Target Library *</label>
                                <LibrarySearchSelect
                                    value={libraryId}
                                    onChange={setLibraryId}
                                    placeholder="Type to search & select target library..."
                                />
                            </div>

                            <div className="dms-form-group">
                                <label className="dms-form-label">Document Name *</label>
                                <input
                                    type="text"
                                    className="dms-form-input"
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    placeholder="e.g. Information Security Policy"
                                    required
                                />
                            </div>

                            <div className="dms-form-group">
                                <label className="dms-form-label">Document Classification / Type</label>
                                <select
                                    className="dms-form-select"
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                >
                                    <option value="policy">Operational Policy</option>
                                    <option value="standard">Technical Standard</option>
                                    <option value="sop">Standard Operating Procedure (SOP)</option>
                                    <option value="guideline">Governance Guideline</option>
                                </select>
                            </div>

                            <div className="dms-form-group">
                                <label className="dms-form-label">Overview & Purpose</label>
                                <textarea
                                    className="dms-form-textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the scope and purpose of this document..."
                                />
                            </div>
                        </div>

                        <div className="dms-modal-footer">
                            <button type="button" className="dms-btn-outline" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="dms-btn-primary" disabled={isSubmitting || !libraryId}>
                                {isSubmitting ? 'Creating...' : 'Create Document'}
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 2: MASTER LIBRARY TEMPLATES */}
                {activeTab === 'master_library' && (
                    <form onSubmit={handleTemplateSubmit}>
                        <div className="dms-modal-body">
                            {/* Searchable Destination Library */}
                            <div className="dms-form-group">
                                <label className="dms-form-label">Destination Library *</label>
                                <LibrarySearchSelect
                                    value={libraryId}
                                    onChange={setLibraryId}
                                    placeholder="Type to search & select destination library..."
                                />
                            </div>

                            <div className="dms-form-group">
                                <label className="dms-form-label">Custom Document Title (Optional)</label>
                                <input
                                    type="text"
                                    className="dms-form-input"
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    placeholder="Leave blank to use template default title"
                                />
                            </div>

                            <div className="dms-form-group">
                                <label className="dms-form-label">Select Master Policy Template *</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                                    {templates.map((tmpl) => (
                                        <div
                                            key={tmpl.id}
                                            onClick={() => setSelectedTemplateId(tmpl.id)}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                border: `1.5px solid ${selectedTemplateId === tmpl.id ? 'var(--dms-primary)' : '#e2e8f0'}`,
                                                background: selectedTemplateId === tmpl.id ? '#f0f7ff' : '#ffffff',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                                                    {tmpl.template_name}
                                                </span>
                                                <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#475569' }}>
                                                    {tmpl.category}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                                                {tmpl.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="dms-modal-footer">
                            <button type="button" className="dms-btn-outline" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="dms-btn-primary" disabled={isSubmitting || !selectedTemplateId || !libraryId}>
                                {isSubmitting ? 'Instantiating...' : 'Instantiate from Template'}
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 3: DOCUMENT UPLOADS (REAL PDF PARSING) */}
                {activeTab === 'document_uploads' && (
                    <div className="dms-modal-body">
                        {uploadStage === 'idle' && (
                            <>
                                {/* Searchable Target Library */}
                                <div className="dms-form-group">
                                    <label className="dms-form-label">Target Library *</label>
                                    <LibrarySearchSelect
                                        value={libraryId}
                                        onChange={setLibraryId}
                                        placeholder="Type to search & select target library..."
                                    />
                                </div>

                                <div className="dms-form-group">
                                    <label className="dms-form-label">Document Name</label>
                                    <input
                                        type="text"
                                        className="dms-form-input"
                                        value={documentName}
                                        onChange={(e) => setDocumentName(e.target.value)}
                                        placeholder="Extracted from file name if blank"
                                    />
                                </div>

                                <div
                                    className="dms-upload-dropzone"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <UploadCloud size={36} className="dms-dropzone-icon" />
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                            {selectedFile ? selectedFile.name : 'Click to select or drag and drop PDF file'}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                                            Supports .PDF and .DOCX files up to 50MB with real section extraction
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept=".pdf,.docx,application/pdf"
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                <div className="dms-modal-footer" style={{ padding: '10px 0 0', background: 'transparent' }}>
                                    <button type="button" className="dms-btn-outline" onClick={onClose}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="dms-btn-primary"
                                        onClick={handleStartUpload}
                                        disabled={!selectedFile || !libraryId || isSubmitting}
                                    >
                                        Upload & Parse PDF
                                    </button>
                                </div>
                            </>
                        )}

                        {(uploadStage === 'uploading' || uploadStage === 'processing') && (
                            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                                <Loader2 size={36} className="dms-dropzone-icon" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '14px 0 6px', color: '#0f172a' }}>
                                    Extracting Document Sections...
                                </h4>
                                <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                                    Real PDF parser is analyzing text boundaries, headings, and hierarchy...
                                </p>
                                <div className="dms-upload-progress-bar">
                                    <div
                                        className="dms-upload-progress-fill"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    {progressPercent}% Complete
                                </span>
                            </div>
                        )}

                        {uploadStage === 'ready_for_review' && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', marginBottom: '12px' }}>
                                    <CheckCircle2 size={18} />
                                    <span style={{ fontSize: '14px', fontWeight: 700 }}>
                                        PDF Successfully Parsed ({extractedSections.length} sections detected)
                                    </span>
                                </div>

                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                    Review the extracted sections before materializing them into PostgreSQL:
                                </p>

                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', background: '#f8fafc' }}>
                                    {extractedSections.map((sec, i) => (
                                        <div key={i} style={{ padding: '6px 0', borderBottom: i < extractedSections.length - 1 ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                                {sec.section_number || `${i + 1}.0`} {sec.section_title}
                                            </span>
                                            {sec.page_start && (
                                                <span style={{ color: '#64748b', fontSize: '11px' }}>
                                                    Page {sec.page_start}..{sec.page_end || sec.page_start}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="dms-modal-footer" style={{ padding: '14px 0 0', background: 'transparent' }}>
                                    <button type="button" className="dms-btn-outline" onClick={onClose}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="dms-btn-primary"
                                        onClick={handleConfirmImport}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Materializing...' : 'Confirm & Open Document'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
