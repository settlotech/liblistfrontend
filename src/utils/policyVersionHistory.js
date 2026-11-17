export function parseVersionParams(val) {
  if (!val) return {};
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return typeof val === 'object' ? val : {};
}

export function parseVersionContentToSections(contentStr = '') {
  const raw = String(contentStr || '').trim();
  if (!raw) return [];
  const parts = raw.split(/(?=###\s+)/).filter((p) => p.trim().length > 0);
  if (parts.length > 1 || /^###\s+/.test(raw)) {
    return parts.map((part, idx) => {
      const m = part.match(/^###\s*(?:\d+\.?\s*)?(.*?)\n([\s\S]*)$/);
      return {
        id: `sec-${idx}`,
        title: m ? m[1].trim() : `Clause ${idx + 1}`,
        content: m ? m[2].trim() : part.trim(),
      };
    });
  }
  return [{ id: 'sec-0', title: 'Policy Specification', content: raw }];
}

export function normalizePolicyVersionItem(ver, fallbackDoc = {}, idx = 0) {
  const verParams = parseVersionParams(ver.parameters);
  const docParams = parseVersionParams(fallbackDoc.parameters);
  const rawNum = ver.version_number || ver.version || fallbackDoc.version || `1.${idx}`;
  const cleanNum = String(rawNum).replace(/^v/i, '');
  const sections =
    Array.isArray(ver.sections) && ver.sections.length > 0
      ? ver.sections
      : Array.isArray(verParams.sections) && verParams.sections.length > 0
        ? verParams.sections
        : ver.content
          ? parseVersionContentToSections(ver.content)
          : Array.isArray(docParams.sections)
            ? docParams.sections
            : [];
  const ts =
    ver.created_at ||
    ver.timestamp ||
    fallbackDoc.updated_at ||
    fallbackDoc.created_at ||
    new Date().toISOString();

  return {
    ...ver,
    id: ver.id || `ver-${cleanNum}-${idx}`,
    policy_id: ver.policy_id || fallbackDoc.id || null,
    version: cleanNum,
    version_number: cleanNum,
    title: ver.title || verParams.title || fallbackDoc.title || 'Operational Policy',
    summary: ver.summary || verParams.summary || fallbackDoc.summary || '',
    content: ver.content || fallbackDoc.content || '',
    sections,
    parameters: { ...docParams, ...verParams, sections },
    changed_by:
      ver.changed_by ||
      ver.version_author ||
      ver.author ||
      fallbackDoc.created_by ||
      'Staff User',
    change_summary:
      ver.change_summary ||
      ver.notes ||
      (fallbackDoc.status === 'draft' ? 'Draft revision snapshot' : 'Policy snapshot'),
    created_at: ts,
    timestamp: ts,
    source: ver.source || (fallbackDoc.status === 'draft' ? 'draft' : 'policy'),
    status_tag: ver.status_tag || fallbackDoc.status || 'active',
  };
}

export function combineAndDeduplicateVersions(policy, remoteVersions = []) {
  if (!policy) return [];
  const params = parseVersionParams(policy.parameters);
  const candidates = [];

  (Array.isArray(remoteVersions) ? remoteVersions : []).forEach((v, idx) => {
    candidates.push(normalizePolicyVersionItem(v, policy, idx));
  });
  (Array.isArray(policy.versions) ? policy.versions : []).forEach((v, idx) => {
    candidates.push(normalizePolicyVersionItem(v, policy, idx));
  });
  (Array.isArray(params.versions) ? params.versions : []).forEach((v, idx) => {
    candidates.push(normalizePolicyVersionItem(v, policy, idx));
  });

  if (candidates.length === 0) {
    candidates.push(
      normalizePolicyVersionItem(
        {
          id: `cur-${policy.id || 'doc'}`,
          policy_id: policy.id || null,
          version_number: policy.version || '1.0',
          title: policy.title,
          summary: policy.summary,
          content: policy.content,
          sections: params.sections || [],
          changed_by: policy.created_by || 'System',
          change_summary:
            policy.status === 'draft'
              ? 'Initial saved draft baseline'
              : 'Initial active baseline version',
          created_at: policy.updated_at || policy.created_at,
        },
        policy,
        0
      )
    );
  }

  const deduped = new Map();
  candidates.forEach((item) => {
    const tsBucket = Math.floor((new Date(item.created_at || 0).getTime() || 0) / 5000);
    const key = `${item.policy_id || policy.id || 'doc'}::${item.version_number}::${(item.change_summary || '').trim().toLowerCase()}::${tsBucket}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, item);
    } else {
      const pickNew = typeof item.id === 'number' && typeof existing.id !== 'number';
      deduped.set(key, {
        ...(pickNew ? existing : item),
        ...(pickNew ? item : existing),
        sections: (item.sections?.length ? item.sections : existing.sections) || [],
        content: item.content || existing.content || '',
      });
    }
  });

  return Array.from(deduped.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}
