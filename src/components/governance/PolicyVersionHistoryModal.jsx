import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  History as HistoryIcon,
  Eye,
  Sliders,
  RotateCcw,
  FileEdit,
  Clock,
  User,
  GitBranch,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import FormattedPolicyContent from '../policy/FormattedPolicyContent';
import {
  parseVersionParams,
  combineAndDeduplicateVersions,
} from '../../utils/policyVersionHistory';

function getSourceBadge(ver) {
  if (ver.source === 'parent_policy' || ver.status_tag === 'parent') {
    return {
      label: 'Parent Policy',
      cls: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }
  if (ver.source === 'draft_revision' || ver.status_tag === 'draft') {
    return {
      label: 'Draft Revision',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  return {
    label: 'Active Policy',
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };
}

export default function PolicyVersionHistoryModal({
  isOpen,
  onClose,
  policy,
  currentUser,
  initialMode = 'timeline',
  initialSelectedVersion = null,
  onRestoreAndEdit = null,
  onPolicyRestored = null,
}) {
  if (!isOpen || !policy || typeof document === 'undefined') return null;

  return (
    <PolicyVersionHistoryModalInner
      key={`${policy.id || 'doc'}-${initialMode}-${initialSelectedVersion?.id || 'none'}`}
      onClose={onClose}
      policy={policy}
      currentUser={currentUser}
      initialMode={initialMode}
      initialSelectedVersion={initialSelectedVersion}
      onRestoreAndEdit={onRestoreAndEdit}
      onPolicyRestored={onPolicyRestored}
    />
  );
}

function PolicyVersionHistoryModalInner({
  onClose,
  policy,
  currentUser,
  initialMode = 'timeline', // 'timeline' | 'compare' | 'view'
  initialSelectedVersion = null,
  onRestoreAndEdit = null,
  onPolicyRestored = null,
}) {
  const [fetchedVersions, setFetchedVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(policy?.id));
  const [isRestoring, setIsRestoring] = useState(false);
  const [mode, setMode] = useState(initialMode || 'timeline');
  const [viewedVersion, setViewedVersion] = useState(initialSelectedVersion || null);
  const [selectedCompareV1Key, setCompareV1Key] = useState('');
  const [selectedCompareV2Key, setCompareV2Key] = useState('');

  useEffect(() => {
    if (!policy?.id) return undefined;
    let cancelled = false;
    apiService
      .getPolicyVersions(policy.id)
      .then((res) => {
        if (!cancelled && Array.isArray(res)) {
          setFetchedVersions(res);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [policy?.id]);

  const versions = useMemo(
    () => combineAndDeduplicateVersions(policy, fetchedVersions),
    [policy, fetchedVersions]
  );

  const compareV2Key = versions.some((v) => String(v.id) === selectedCompareV2Key)
    ? selectedCompareV2Key
    : String(versions[0]?.id || '');
  const compareV1Key = versions.some((v) => String(v.id) === selectedCompareV1Key)
    ? selectedCompareV1Key
    : String(versions[versions.length - 1]?.id || '');

  const isDraftDoc = policy.status === 'draft';
  const canDirectRestore =
    isDraftDoc ||
    currentUser?.roleType === 'manager' ||
    currentUser?.roleType === 'admin';

  const handleRestoreVersion = async (ver) => {
    if (!ver) return;
    if (onRestoreAndEdit && isDraftDoc) {
      const params = parseVersionParams(policy.parameters);
      onRestoreAndEdit({
        ...policy,
        title: ver.title || policy.title,
        summary: ver.summary || policy.summary,
        version: ver.version_number || ver.version,
        content: ver.content || policy.content,
        parameters: {
          ...params,
          version: ver.version_number || ver.version,
          sections: ver.sections || params.sections || [],
        },
      });
      apiService
        .restorePolicyVersion(policy.id, ver.id || ver.version_number, currentUser?.name)
        .catch(() => {});
      onClose();
      return;
    }

    if (!window.confirm(`Restore "${policy.title}" to version v${ver.version_number}?`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await apiService.restorePolicyVersion(
        policy.id,
        ver.id || ver.version_number,
        currentUser?.name || 'Authorized Officer'
      );
      if (onPolicyRestored) {
        onPolicyRestored(res?.policy || res, ver);
      }
      onClose();
    } catch (err) {
      alert('Failed to restore version: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRestoring(false);
    }
  };

  const verA =
    versions.find((v) => String(v.id) === compareV1Key) ||
    versions[versions.length - 1] ||
    versions[0];
  const verB = versions.find((v) => String(v.id) === compareV2Key) || versions[0];

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <GitBranch className="w-4 h-4 text-[#0057B8]" />
              <h3 className="text-base font-bold text-slate-900 truncate">
                Version History • {policy.title}
              </h3>
              <span
                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                  isDraftDoc
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-blue-50 text-[#0057B8] border-blue-200'
                }`}
              >
                {isDraftDoc ? 'Draft Document' : 'Active Policy'} • v
                {String(policy.version || '1.0').replace(/^v/i, '')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Combined timeline across saved draft revisions, baseline approvals, and parent policy history ({versions.length} revisions).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode('timeline')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mode === 'timeline'
                    ? 'bg-[#0057B8] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HistoryIcon className="w-3.5 h-3.5" />
                <span>Revisions ({versions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('compare')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mode === 'compare'
                    ? 'bg-[#0057B8] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Compare & Diff</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg cursor-pointer transition"
              title="Close version history"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc] custom-scrollbar">
          {isLoading && versions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading combined revision history...
            </div>
          ) : mode === 'view' && viewedVersion ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 bg-white p-4 rounded-2xl shadow-2xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setMode('timeline')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Revisions</span>
                  </button>
                  <span className="font-mono font-bold text-xs bg-blue-100 text-[#0057B8] px-2.5 py-1 rounded-md">
                    v{viewedVersion.version_number}
                  </span>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                      getSourceBadge(viewedVersion).cls
                    }`}
                  >
                    {getSourceBadge(viewedVersion).label}
                  </span>
                  <div className="text-xs text-slate-600">
                    <strong>{viewedVersion.changed_by}</strong> •{' '}
                    {new Date(viewedVersion.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCompareV1Key(String(viewedVersion.id));
                      setMode('compare');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#0057B8] border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Compare With Current</span>
                  </button>
                  {canDirectRestore && (
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => handleRestoreVersion(viewedVersion)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0057B8] hover:bg-[#004EA6] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isDraftDoc ? <FileEdit className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>{isDraftDoc ? 'Restore & Edit' : 'Restore Version'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{viewedVersion.title}</h4>
                  {viewedVersion.summary && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {viewedVersion.summary}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                    Revision Note: {viewedVersion.change_summary}
                  </p>
                </div>

                <FormattedPolicyContent
                  content={viewedVersion.content}
                  sections={
                    Array.isArray(viewedVersion.sections) && viewedVersion.sections.length > 0
                      ? viewedVersion.sections
                      : null
                  }
                  policyId={policy.id}
                  policyTitle={viewedVersion.title}
                />
              </div>
            </div>
          ) : mode === 'compare' && verA && verB ? (
            (() => {
              const secsA = verA.sections || [];
              const secsB = verB.sections || [];
              const allTitles = Array.from(
                new Set([
                  ...secsA.map((s) => s.title || 'Untitled Section'),
                  ...secsB.map((s) => s.title || 'Untitled Section'),
                ])
              );

              return (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Layers className="w-4 h-4 text-[#0057B8]" />
                      <span>Compare Two Revisions Clause-by-Clause</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <span>Base:</span>
                        <select
                          value={String(verA.id)}
                          onChange={(e) => setCompareV1Key(e.target.value)}
                          className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800"
                        >
                          {versions.map((v) => (
                            <option key={v.id} value={String(v.id)}>
                              v{v.version_number} — {getSourceBadge(v).label} ({new Date(v.created_at).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="text-slate-400 font-bold">→</span>
                      <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <span>Compare:</span>
                        <select
                          value={String(verB.id)}
                          onChange={(e) => setCompareV2Key(e.target.value)}
                          className="p-1.5 border border-blue-300 rounded-lg bg-blue-50/50 font-bold text-[#0057B8]"
                        >
                          {versions.map((v) => (
                            <option key={v.id} value={String(v.id)}>
                              v{v.version_number} — {getSourceBadge(v).label} ({new Date(v.created_at).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {allTitles.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                        No structured clauses recorded between these snapshots.
                      </div>
                    ) : (
                      allTitles.map((tTitle, tIdx) => {
                        const sA = secsA.find((s) => (s.title || 'Untitled Section') === tTitle);
                        const sB = secsB.find((s) => (s.title || 'Untitled Section') === tTitle);

                        let status = 'unchanged';
                        let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        let badgeText = 'No changes';

                        if (!sA && sB) {
                          status = 'added';
                          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          badgeText = '+ Added Clause';
                        } else if (sA && !sB) {
                          status = 'removed';
                          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                          badgeText = '- Removed Clause';
                        } else if (sA && sB && (sA.content || '').trim() !== (sB.content || '').trim()) {
                          status = 'modified';
                          badgeColor = 'bg-blue-50 text-[#0057B8] border-blue-200';
                          badgeText = '~ Modified';
                        }

                        return (
                          <div
                            key={tIdx}
                            className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-3 ${
                              status === 'added'
                                ? 'border-emerald-200'
                                : status === 'removed'
                                  ? 'border-rose-200'
                                  : status === 'modified'
                                    ? 'border-blue-200'
                                    : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                              <span className="font-bold text-slate-900 text-xs">
                                {tIdx + 1}. {tTitle}
                              </span>
                              <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                                {badgeText}
                              </span>
                            </div>

                            {status === 'modified' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-rose-50/30 border border-rose-100">
                                  <span className="text-[10px] font-bold uppercase text-rose-700 block mb-1.5">
                                    Base (v{verA.version_number})
                                  </span>
                                  <FormattedPolicyContent content={sA?.content || ''} />
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100">
                                  <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1.5">
                                    Compare (v{verB.version_number})
                                  </span>
                                  <FormattedPolicyContent content={sB?.content || ''} />
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl bg-slate-50/60">
                                <FormattedPolicyContent content={(sB || sA)?.content || ''} />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="space-y-2.5">
              {versions.map((ver, vIdx) => {
                const badge = getSourceBadge(ver);
                const isLatestSelf =
                  vIdx === 0 && (!ver.policy_id || String(ver.policy_id) === String(policy.id));
                return (
                  <div
                    key={ver.id || vIdx}
                    className={`p-4 rounded-2xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition ${
                      isLatestSelf ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="font-mono font-bold text-xs bg-blue-100 text-[#0057B8] px-2.5 py-1 rounded-lg flex-shrink-0">
                        v{ver.version_number}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-[13px] truncate">
                            {ver.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {isLatestSelf && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0057B8] border border-blue-200">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {ver.change_summary}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{ver.changed_by}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(ver.created_at).toLocaleString()}</span>
                          </span>
                          <span>• {(ver.sections || []).length} Sections</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setViewedVersion(ver);
                          setMode('view');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0057B8] border border-slate-200 hover:border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {canDirectRestore && (
                        <button
                          type="button"
                          disabled={isRestoring}
                          onClick={() => handleRestoreVersion(ver)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#0057B8] border border-blue-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isDraftDoc ? <FileEdit className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          <span>{isDraftDoc ? 'Restore & Edit' : 'Restore'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
