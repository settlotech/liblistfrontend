/**
 * Cloudinary Document Management Service
 * Handles uploading documents (PDF, Word DOCX/DOC, Sheets XLSX/CSV, Images, TXT)
 * to Cloudinary CDN, calculating secure SHA-1 signatures, and managing uploaded
 * document history with viewing, correcting, comparing, and TipTap editing support.
 */

const CLOUD_NAME = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'lwddcyps';
const API_KEY = import.meta.env?.VITE_CLOUDINARY_API_KEY || '652225388423764';
const API_SECRET = import.meta.env?.VITE_CLOUDINARY_API_SECRET || 'tz28hzvs1wKhBd6uMvsSUsv1Vog';
const STORAGE_KEY = 'liblist_document_upload_history';

/**
 * Pure JavaScript SHA-1 implementation to guarantee zero external dependency
 * and reliable execution across all browser contexts (HTTPS, HTTP, localhost).
 */
function sha1(str) {
  function rotateLeft(n, s) {
    return (n << s) | (n >>> (32 - s));
  }

  function cvtHex(val) {
    let strVal = '';
    for (let i = 7; i >= 0; i--) {
      const v = (val >>> (i * 4)) & 0x0f;
      strVal += v.toString(16);
    }
    return strVal;
  }

  const blocksize = 64;
  const utf8 = unescape(encodeURIComponent(str));
  const words = [];
  let i;

  for (i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
  words[(((utf8.length + 8) >> 6) << 4) + 15] = utf8.length * 8;

  let H0 = 0x67452301;
  let H1 = 0xefcdab89;
  let H2 = 0x98badcfe;
  let H3 = 0x10325476;
  let H4 = 0xc3d2e1f0;

  const w = new Array(80);

  for (let b = 0; b < words.length; b += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = words[b + t] || 0;
    }
    for (let t = 16; t < 80; t++) {
      w[t] = rotateLeft(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    }

    let A = H0;
    let B = H1;
    let C = H2;
    let D = H3;
    let E = H4;

    for (let t = 0; t < 80; t++) {
      let f, k;
      if (t < 20) {
        f = (B & C) | (~B & D);
        k = 0x5a827999;
      } else if (t < 40) {
        f = B ^ C ^ D;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (B & C) | (B & D) | (C & D);
        k = 0x8f1bbcdc;
      } else {
        f = B ^ C ^ D;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(A, 5) + f + E + k + (w[t] >>> 0)) >>> 0;
      E = D;
      D = C;
      C = rotateLeft(B, 30) >>> 0;
      B = A;
      A = temp;
    }

    H0 = (H0 + A) >>> 0;
    H1 = (H1 + B) >>> 0;
    H2 = (H2 + C) >>> 0;
    H3 = (H3 + D) >>> 0;
    H4 = (H4 + E) >>> 0;
  }

  return [H0, H1, H2, H3, H4].map(cvtHex).join('');
}

/**
 * Format bytes into human readable format
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Identify file classification
 */
export function getFileTypeInfo(fileName = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext)) {
    return { type: 'pdf', label: 'PDF Document', color: 'red', ext };
  }
  if (['docx', 'doc', 'dotx'].includes(ext)) {
    return { type: 'docx', label: 'Word Document', color: 'blue', ext };
  }
  if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
    return { type: 'xlsx', label: 'Sheet / Excel', color: 'emerald', ext };
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
    return { type: 'image', label: 'Policy Graphic / Diagram', color: 'purple', ext };
  }
  return { type: 'txt', label: 'Text / Raw', color: 'slate', ext };
}

/**
 * Seed data for realistic Australian Banking environment
 */
const SEED_DOCUMENTS = [
  {
    id: 'seed-doc-template-policy',
    name: 'Template_policy.docx',
    originalName: 'Template_policy.docx',
    fileType: 'docx',
    fileSize: 45200,
    sizeFormatted: '44.1 KB',
    url: 'https://res.cloudinary.com/lwddcyps/raw/upload/v1794763137/Template_policy.docx',
    secureUrl: 'https://res.cloudinary.com/lwddcyps/raw/upload/v1794763137/Template_policy.docx',
    publicId: 'Template_policy_docx',
    resourceType: 'raw',
    format: 'docx',
    uploadedAt: '2026-11-15T18:30:00.000Z',
    uploadedAtFormatted: '15 Nov 2026, 06:30 pm',
    status: 'synced',
    templateId: 'template-standard-policy',
    templateName: 'Standard Policy Template',
    notes: 'Institutional template dividing policy into 8 standard APRA sections: Title, Purpose, Scope, Details, Pre-requisites, Controls, Reporting, Approval Chain.'
  },
  {
    id: 'seed-doc-hl-valuation',
    name: 'hl_valuation.pdf',
    originalName: 'hl_valuation.pdf',
    fileType: 'pdf',
    fileSize: 135800,
    sizeFormatted: '132.6 KB',
    url: 'https://res.cloudinary.com/lwddcyps/raw/upload/v1794763137/hl_valuation.pdf',
    secureUrl: 'https://res.cloudinary.com/lwddcyps/raw/upload/v1794763137/hl_valuation.pdf',
    publicId: 'hl_valuation_pdf',
    resourceType: 'raw',
    format: 'pdf',
    uploadedAt: '2026-11-15T17:15:00.000Z',
    uploadedAtFormatted: '15 Nov 2026, 05:15 pm',
    status: 'synced',
    templateId: 'template-01-policy',
    templateName: 'Credit Cards & Revolving Credit Guidelines',
    notes: 'APRA APS 220 Valuation Standards & Security Margin Assessment Rules.'
  }
];

/**
 * Retrieves document upload history from localStorage
 */
export function getDocumentUploadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Error reading document upload history:', err);
    return [];
  }
}

/**
 * Saves or updates a document in upload history
 */
export function saveDocumentToHistory(docItem) {
  try {
    const current = getDocumentUploadHistory();
    const existingIndex = current.findIndex(d => d.id === docItem.id || (d.publicId && d.publicId === docItem.publicId));
    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...docItem };
    } else {
      updated = [docItem, ...current];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('liblist-doc-history-updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to save document to history:', err);
    return getDocumentUploadHistory();
  }
}

/**
 * Deletes a document from upload history
 */
export function deleteDocumentFromHistory(id) {
  try {
    const current = getDocumentUploadHistory();
    const updated = current.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('liblist-doc-history-updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to remove document from history:', err);
    return getDocumentUploadHistory();
  }
}

/**
 * Clears all uploaded document history
 */
export function clearDocumentHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('liblist-doc-history-updated', { detail: [] }));
    return [];
  } catch (err) {
    console.error('Failed to clear history:', err);
    return [];
  }
}

/**
 * Uploads a file (PDF, Word DOCX, Sheets XLSX/CSV, Images) to Cloudinary CDN
 * with secure SHA-1 cryptographic signature and persists to history.
 *
 * @param {File|Blob} file The file to upload
 * @param {Object} metadata Optional metadata like templateId, templateName, extractedSections
 * @returns {Promise<Object>} The uploaded document record
 */
export async function uploadDocumentToCloudinary(file, metadata = {}) {
  if (!file) {
    throw new Error('No file provided for Cloudinary upload.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
  const signature = sha1(stringToSign);

  const fileInfo = getFileTypeInfo(file.name || 'document.pdf');
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Cloudinary API upload error:', errText);
    throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const docItem = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: file.name || data.original_filename || 'Uploaded Document',
    originalName: file.name || data.original_filename || 'Uploaded Document',
    fileType: fileInfo.type,
    fileSize: file.size || data.bytes || 0,
    sizeFormatted: formatBytes(file.size || data.bytes || 0),
    url: data.secure_url || data.url,
    secureUrl: data.secure_url || data.url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    format: data.format || fileInfo.ext,
    uploadedAt: new Date().toISOString(),
    uploadedAtFormatted: new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    status: 'synced',
    cloudinarySync: true,
    isCloudinarySynced: true,
    userId: metadata.userId || null,
    userName: metadata.userName || null,
    templateId: metadata.templateId || 'template-standard-policy',
    templateName: metadata.templateName || 'Standard Policy Template',
    extractedSections: metadata.extractedSections || null,
    notes: metadata.notes || ''
  };

  // Persist to history
  saveDocumentToHistory(docItem);

  return docItem;
}

export const cloudinaryService = {
  uploadDocumentToCloudinary,
  getDocumentUploadHistory,
  saveDocumentToHistory,
  deleteDocumentFromHistory,
  clearDocumentHistory,
  getFileTypeInfo,
  formatBytes,
  CLOUD_NAME,
  API_KEY
};

export default cloudinaryService;

