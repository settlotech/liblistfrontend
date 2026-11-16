import { apiFetch } from '../services/api/baseApi';
import { getUser as getStoredAuthUser } from '../services/auth.service';

export const USER_NOTES_EVENT = 'liblist:user-notes-updated';

const DEFAULT_STARTER_NOTES = [
  {
    id: 'starter-note-1',
    clientId: 'starter-note-1',
    itemType: 'note',
    noteNumber: null,
    title: 'APRA CPS 234 Compliance Review & Audit Notes',
    content: 'Review meeting with Credit Risk committee regarding CPS 234 cloud security and data controls for online card applications.\n\nKey Action Items:\n1. Verify multi-factor authentication logging for all officer approvals over $25,000.\n2. Ensure encryption keys are rotated quarterly.\n3. Validate turnaround SLAs against Q3 compliance reporting.',
    category: 'Compliance',
    policyId: null,
    policyTitle: '',
    departmentName: '',
    targetType: 'general',
    targetAnchor: {},
    pinned: true,
    isStarter: true,
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'starter-note-2',
    clientId: 'starter-note-2',
    itemType: 'note',
    noteNumber: null,
    title: 'Credit Card Underwriting Threshold Notes',
    content: 'Discussion with senior credit assessor regarding prime borrower buffer calculation:\n- Minimum Equifax credit score requirement of 620 remains mandatory.\n- Automated approval threshold for Level 1 junior assessors set to $5,000 max.\n- Level 2 escalation required for applicants with existing revolving credit exposure > $30,000.',
    category: 'Policy Drafts',
    policyId: null,
    policyTitle: '',
    departmentName: '',
    targetType: 'general',
    targetAnchor: {},
    pinned: true,
    isStarter: true,
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export function resolveUserKey(user) {
  const effectiveUser = user || getStoredAuthUser() || {};
  const raw = effectiveUser.id || effectiveUser.email || effectiveUser.name || 'default';
  return String(raw).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
}

export function getUserStorageKey(user) {
  return `liblist_user_notes_v2_${resolveUserKey(user)}`;
}

function getAuthHeaders(user) {
  const effectiveUser = user || getStoredAuthUser();
  const uid = effectiveUser?.id || effectiveUser?.email;
  return uid ? { 'X-User-Id': String(uid) } : {};
}

export function normalizeNoteItem(item) {
  if (!item) return null;
  const itemType = item.itemType === 'annotation' || item.item_type === 'annotation' ? 'annotation' : 'note';
  const rawNum = item.noteNumber !== undefined ? item.noteNumber : item.note_number;
  const noteNumber = rawNum === null || rawNum === undefined || rawNum === '' ? null : Number(rawNum);
  const clientId = String(item.clientId || item.client_id || item.id);
  let targetAnchor = item.targetAnchor || item.target_anchor || {};
  if (typeof targetAnchor === 'string') {
    try {
      targetAnchor = JSON.parse(targetAnchor);
    } catch {
      targetAnchor = {};
    }
  }
  return {
    id: clientId,
    dbId: item.dbId || (typeof item.id === 'number' ? item.id : undefined),
    clientId,
    userId: item.userId || item.user_id || undefined,
    itemType,
    noteNumber: Number.isFinite(noteNumber) ? noteNumber : null,
    title: item.title || '',
    content: item.content || '',
    category: item.category || (itemType === 'annotation' ? 'Visual Annotation' : 'Policy Note'),
    policyId: item.policyId || item.policy_id || null,
    policyTitle: item.policyTitle || item.policy_title || '',
    departmentName: item.departmentName || item.department_name || '',
    targetType: item.targetType || item.target_type || (itemType === 'annotation' ? 'graph' : 'section'),
    targetAnchor,
    pinned: Boolean(item.pinned),
    isStarter: Boolean(item.isStarter),
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
  };
}

export function getNextSequentialNumber(items, itemType = 'note') {
  const type = itemType === 'annotation' ? 'annotation' : 'note';
  const maxNum = (Array.isArray(items) ? items : []).reduce((max, item) => {
    if (!item || item.itemType !== type) return max;
    const n = Number(item.noteNumber);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return maxNum + 1;
}

export function saveLocalUserNotes(user, items) {
  const key = getUserStorageKey(user);
  const normalized = (Array.isArray(items) ? items : []).map(normalizeNoteItem).filter(Boolean);
  try {
    localStorage.setItem(key, JSON.stringify(normalized));
  } catch {
    // Strip large inline image snapshots from localStorage backup if storage quota is tight
    try {
      const compact = normalized.map((item) => {
        const snap = item.targetAnchor?.snapshotDataUrl;
        if (typeof snap === 'string' && snap.length > 150000) {
          return {
            ...item,
            targetAnchor: { ...item.targetAnchor, snapshotDataUrl: '' },
          };
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(compact));
    } catch {
      // Ignore quota failure gracefully
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(USER_NOTES_EVENT, { detail: { userKey: resolveUserKey(user), items: normalized } }));
  }
  return normalized;
}

export function loadLocalUserNotes(user) {
  const key = getUserStorageKey(user);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeNoteItem).filter(Boolean);
      }
    }
  } catch {
    // Fall through to starter initialization
  }

  // Optional one-time read of legacy shared notes without stealing #1, #2, #3 IDs
  try {
    const legacyRaw = localStorage.getItem('liblist_user_notes');
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (Array.isArray(legacy) && legacy.length > 0) {
        const migrated = legacy.map((n, idx) =>
          normalizeNoteItem({
            ...n,
            clientId: n.id || `legacy-note-${idx}`,
            itemType: 'note',
            noteNumber: null,
            isStarter: true,
          })
        );
        saveLocalUserNotes(user, migrated);
        return migrated;
      }
    }
  } catch {
    // Ignore
  }

  return DEFAULT_STARTER_NOTES.map((n) => normalizeNoteItem(n));
}

export async function fetchUserNotes(user) {
  const local = loadLocalUserNotes(user);
  try {
    const res = await apiFetch('/user-notes', {
      headers: getAuthHeaders(user),
    });
    const remoteList = Array.isArray(res?.data) ? res.data.map(normalizeNoteItem).filter(Boolean) : [];
    if (remoteList.length > 0) {
      // Merge any local user-created items not yet persisted remotely
      const remoteIds = new Set(remoteList.map((r) => r.clientId));
      const localOnly = local.filter((l) => !remoteIds.has(l.clientId) && l.policyId);
      const merged = [...remoteList, ...localOnly];
      saveLocalUserNotes(user, merged);
      return merged;
    }
    return local;
  } catch {
    return local;
  }
}

export async function createUserNoteOrAnnotation(user, payload) {
  const existing = loadLocalUserNotes(user);
  const itemType = payload.itemType === 'annotation' ? 'annotation' : 'note';
  const nextNum = getNextSequentialNumber(existing, itemType);
  const clientId = `${itemType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const optimistic = normalizeNoteItem({
    ...payload,
    id: clientId,
    clientId,
    userId: resolveUserKey(user),
    itemType,
    noteNumber: nextNum,
    title: payload.title || (itemType === 'annotation' ? `Annotation #${nextNum}` : `Note #${nextNum}`),
    category: payload.category || (itemType === 'annotation' ? 'Visual Annotation' : 'Policy Note'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Drop starter placeholders if this is the user's real items being stored? Keep starters if they want, or keep all cleanly.
  const withoutDuplicate = existing.filter((i) => i.clientId !== clientId);
  saveLocalUserNotes(user, [optimistic, ...withoutDuplicate]);

  try {
    const res = await apiFetch('/user-notes', {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify(optimistic),
    });
    const serverItem = normalizeNoteItem(res?.data);
    if (serverItem) {
      const latest = loadLocalUserNotes(user);
      const updatedList = [serverItem, ...latest.filter((i) => i.clientId !== clientId && i.clientId !== serverItem.clientId)];
      saveLocalUserNotes(user, updatedList);
      return serverItem;
    }
  } catch {
    // Kept in per-user localStorage cleanly when backend isn't reachable
  }

  return optimistic;
}

export async function updateUserNoteOrAnnotation(user, idOrClientId, updates) {
  const existing = loadLocalUserNotes(user);
  const targetKey = String(idOrClientId);
  const nextList = existing.map((item) => {
    if (String(item.clientId) === targetKey || String(item.id) === targetKey) {
      return normalizeNoteItem({
        ...item,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
    return item;
  });
  saveLocalUserNotes(user, nextList);

  const targetItem = nextList.find((i) => String(i.clientId) === targetKey || String(i.id) === targetKey);
  if (targetItem && !targetItem.isStarter) {
    try {
      await apiFetch(`/user-notes/${encodeURIComponent(targetKey)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(user),
        body: JSON.stringify(updates),
      });
    } catch {
      // Ignore network fallback
    }
  }
  return targetItem || null;
}

export async function deleteUserNoteOrAnnotation(user, idOrClientId) {
  const existing = loadLocalUserNotes(user);
  const targetKey = String(idOrClientId);
  const targetItem = existing.find((i) => String(i.clientId) === targetKey || String(i.id) === targetKey);
  const nextList = existing.filter((i) => String(i.clientId) !== targetKey && String(i.id) !== targetKey);
  saveLocalUserNotes(user, nextList);

  if (targetItem && !targetItem.isStarter) {
    try {
      await apiFetch(`/user-notes/${encodeURIComponent(targetKey)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user),
      });
    } catch {
      // Ignore network fallback
    }
  }
  return nextList;
}

export function getUserNoteById(user, idOrClientId) {
  if (!idOrClientId) return null;
  const items = loadLocalUserNotes(user);
  const key = String(idOrClientId);
  return items.find((i) => String(i.clientId) === key || String(i.id) === key) || null;
}

/**
 * Filter Note / Annotation item by numeric ID (#1, 1, Note 1, Annotation 2) or by written Note Point / Title / Excerpt.
 */
export function matchesNoteSearch(item, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) return true;
  const q = searchQuery.trim().toLowerCase();

  // Direct ID search: e.g. "1", "#1", "note 1", "note #1", "annotation 2", "ann 2"
  const idMatch = q.match(/^(?:(note|annotation|ann|id)\s*:?\s*)?#?(\d+)$/i);
  if (idMatch) {
    const scope = idMatch[1] ? idMatch[1].toLowerCase() : null;
    const targetNum = Number(idMatch[2]);
    if (item.noteNumber === targetNum) {
      if (!scope || scope === 'id') return true;
      if (scope === 'note' && item.itemType === 'note') return true;
      if ((scope === 'annotation' || scope === 'ann') && item.itemType === 'annotation') return true;
    }
    // Also match literal text (e.g. searching "2" matching "Tier 2") when user typed plain digits
    if (!scope && !q.startsWith('#')) {
      const searchableText = [
        item.content,
        item.title,
        item.targetAnchor?.sectionTitle,
        item.targetAnchor?.excerpt,
        item.targetAnchor?.lineText,
        item.policyTitle,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchableText.includes(q);
    }
    return false;
  }

  const haystack = [
    item.noteNumber !== null && item.noteNumber !== undefined ? `#${item.noteNumber}` : '',
    item.noteNumber !== null && item.noteNumber !== undefined ? `${item.itemType} #${item.noteNumber}` : '',
    item.noteNumber !== null && item.noteNumber !== undefined ? `${item.itemType} ${item.noteNumber}` : '',
    item.title,
    item.content,
    item.category,
    item.policyTitle,
    item.departmentName,
    item.targetAnchor?.sectionTitle,
    item.targetAnchor?.excerpt,
    item.targetAnchor?.lineText,
    item.targetAnchor?.selectedText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}
