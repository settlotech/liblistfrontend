import { apiFetch, API_BASE } from './baseApi';

const DMS_BASE = '/document-management';

export const documentManagementApi = {
    // ── LIBRARIES ──
    async getLibraries(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${DMS_BASE}/libraries${query ? `?${query}` : ''}`;
        return apiFetch(endpoint);
    },

    async getLibraryHierarchy(libraryId = null) {
        const endpoint = libraryId
            ? `${DMS_BASE}/libraries/hierarchy?id=${encodeURIComponent(libraryId)}`
            : `${DMS_BASE}/libraries/hierarchy`;
        return apiFetch(endpoint);
    },

    async getLibraryById(id) {
        return apiFetch(`${DMS_BASE}/libraries/${id}`);
    },

    async createLibrary(data) {
        return apiFetch(`${DMS_BASE}/libraries`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateLibrary(id, data) {
        return apiFetch(`${DMS_BASE}/libraries/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteLibrary(id) {
        return apiFetch(`${DMS_BASE}/libraries/${id}`, {
            method: 'DELETE',
        });
    },

    // ── DOCUMENTS ──
    async getDocuments(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${DMS_BASE}/documents${query ? `?${query}` : ''}`;
        return apiFetch(endpoint);
    },

    async getDocumentById(id) {
        return apiFetch(`${DMS_BASE}/documents/${id}`);
    },

    async createDocument(data) {
        return apiFetch(`${DMS_BASE}/documents`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateDocument(id, data) {
        return apiFetch(`${DMS_BASE}/documents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteDocument(id) {
        return apiFetch(`${DMS_BASE}/documents/${id}`, {
            method: 'DELETE',
        });
    },

    // ── SECTIONS ──
    async getSections(documentId) {
        return apiFetch(`${DMS_BASE}/sections/document/${documentId}?include_content=true`);
    },

    async getSectionById(id) {
        return apiFetch(`${DMS_BASE}/sections/${id}`);
    },

    async createSection(data) {
        return apiFetch(`${DMS_BASE}/sections`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateSection(id, data) {
        return apiFetch(`${DMS_BASE}/sections/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async updateSectionContent(id, data) {
        return apiFetch(`${DMS_BASE}/sections/${id}/content`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async deleteSection(id) {
        return apiFetch(`${DMS_BASE}/sections/${id}`, {
            method: 'DELETE',
        });
    },

    async reorderSections(documentId, sectionOrders) {
        return apiFetch(`${DMS_BASE}/sections/document/${documentId}/reorder`, {
            method: 'PATCH',
            body: JSON.stringify({ sections: sectionOrders }),
        });
    },

    // ── ASSETS / IMAGES ──
    async uploadImage(documentId, file, sectionId = null) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('image', file);
        formData.append('document_id', documentId);
        if (sectionId) formData.append('section_id', sectionId);

        return apiFetch(`${DMS_BASE}/assets/document/${documentId}/upload-image`, {
            method: 'POST',
            body: formData,
        });
    },

    async getDocumentAssets(documentId) {
        return apiFetch(`${DMS_BASE}/assets/document/${documentId}`);
    },

    // ── ANNOTATIONS ──
    async getAnnotations(documentId, params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${DMS_BASE}/annotations/document/${documentId}${query ? `?${query}` : ''}`;
        return apiFetch(endpoint);
    },

    async createAnnotation(data) {
        return apiFetch(`${DMS_BASE}/annotations`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateAnnotation(id, data) {
        return apiFetch(`${DMS_BASE}/annotations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteAnnotation(id) {
        return apiFetch(`${DMS_BASE}/annotations/${id}`, {
            method: 'DELETE',
        });
    },

    // ── VERSIONS / COMMITS ──
    async getVersions(documentId) {
        return apiFetch(`${DMS_BASE}/versions/document/${documentId}`);
    },

    async getVersionById(id) {
        return apiFetch(`${DMS_BASE}/versions/${id}`);
    },

    async commitDocument(documentId, data) {
        return apiFetch(`${DMS_BASE}/versions/${documentId}/commit`, {
            method: 'POST',
            body: JSON.stringify({
                document_id: documentId,
                ...data,
            }),
        });
    },

    async compareVersions(versionId1, versionId2) {
        return apiFetch(`${DMS_BASE}/versions/compare?v1=${versionId1}&v2=${versionId2}`);
    },

    async restoreVersion(documentId, versionId, commitMessage = '') {
        const url = versionId
            ? `${DMS_BASE}/versions/${documentId}/restore/${versionId}`
            : `${DMS_BASE}/versions/${documentId}/restore`;
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                version_id: versionId,
                document_id: documentId,
                commit_message: commitMessage,
            }),
        });
    },

    // ── ACTIVITY LOGS ──
    async getActivityLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${DMS_BASE}/activity${query ? `?${query}` : ''}`;
        return apiFetch(endpoint);
    },

    async getDocumentActivity(documentId) {
        return apiFetch(`${DMS_BASE}/activity/document/${documentId}`);
    },

    // ── REFERENCES ──
    async getReferences(documentId) {
        return apiFetch(`${DMS_BASE}/references/document/${documentId}`);
    },

    // ── TEMPLATES ──
    async getTemplates(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${DMS_BASE}/templates${query ? `?${query}` : ''}`;
        return apiFetch(endpoint);
    },

    async applyTemplate(templateId, libraryId, documentName) {
        return apiFetch(`${DMS_BASE}/templates/${templateId}/instantiate`, {
            method: 'POST',
            body: JSON.stringify({ library_id: libraryId, document_name: documentName }),
        });
    },

    // ── REAL PDF IMPORT PIPELINE ──
    async uploadPdfForImport(libraryId, file, documentName = '') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('library_id', libraryId);
        if (documentName) formData.append('document_name', documentName);

        return apiFetch(`${DMS_BASE}/import/upload`, {
            method: 'POST',
            body: formData,
        });
    },

    async getImportJobStatus(jobId) {
        return apiFetch(`${DMS_BASE}/import/jobs/${jobId}`);
    },

    async confirmImportedSections(jobId, sections = null) {
        return apiFetch(`${DMS_BASE}/import/jobs/${jobId}/confirm`, {
            method: 'POST',
            body: JSON.stringify(sections ? { sections } : {}),
        });
    },
};
