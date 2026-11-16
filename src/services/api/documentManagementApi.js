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

    // ── LIBRARY REMOVAL WORKFLOW (Maker-Checker) ──
    async requestLibraryRemoval(id, reason) {
        return apiFetch(`${DMS_BASE}/libraries/${id}/request-removal`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    async reviewLibraryRemoval(id, action, feedback = null) {
        return apiFetch(`${DMS_BASE}/libraries/${id}/review-removal`, {
            method: 'PATCH',
            body: JSON.stringify({ action, feedback }),
        });
    },

    async getPendingLibraryRemovals() {
        return apiFetch(`${DMS_BASE}/libraries/pending-removals`);
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

    // ── PINNED POLICIES ──
    async getPinnedPolicies() {
        return apiFetch(`${DMS_BASE}/documents/pinned`);
    },

    async pinPolicy(id) {
        return apiFetch(`${DMS_BASE}/documents/${id}/pin`, {
            method: 'POST',
        });
    },

    async unpinPolicy(id) {
        return apiFetch(`${DMS_BASE}/documents/${id}/pin`, {
            method: 'DELETE',
        });
    },

    async getPolicyPinStatus(id) {
        return apiFetch(`${DMS_BASE}/documents/${id}/pin-status`);
    },

    // ── AI DOCUMENT EXTRACTION & INGESTION ──
    async aiExtractPolicy(formDataOrJson) {
        const isFormData = formDataOrJson instanceof FormData;
        return apiFetch(`${DMS_BASE}/documents/ai-extract`, {
            method: 'POST',
            body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
        });
    },

    async getDocumentMetadata(id) {
        return apiFetch(`${DMS_BASE}/documents/${id}/metadata`);
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

    async reviewDocument(id, action, rejection_reason = null) {
        return apiFetch(`${DMS_BASE}/documents/${id}/approval`, {
            method: 'PATCH',
            body: JSON.stringify({ action, rejection_reason }),
        });
    },

    async getPolicyAccess(documentId) {
        return apiFetch(`${DMS_BASE}/documents/${documentId}/access`);
    },

    async updatePolicyAccess(documentId, data) {
        return apiFetch(`${DMS_BASE}/documents/${documentId}/access`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // User-centric: get all policies with access flags for a specific user
    async getUserPolicyAccess(userId) {
        return apiFetch(`${DMS_BASE}/documents/user-access/${userId}`);
    },

    // User-centric: bulk update all policy access for a specific user
    async bulkUpdateUserPolicyAccess(userId, policies) {
        return apiFetch(`${DMS_BASE}/documents/user-access/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ policies }),
        });
    },

    // ── POLICY REMOVAL WORKFLOW (Maker-Checker) ──
    async requestPolicyRemoval(id, reason) {
        return apiFetch(`${DMS_BASE}/documents/${id}/request-removal`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    async reviewPolicyRemoval(id, action, feedback = null) {
        return apiFetch(`${DMS_BASE}/documents/${id}/review-removal`, {
            method: 'PATCH',
            body: JSON.stringify({ action, feedback }),
        });
    },

    async getPendingPolicyRemovals() {
        return apiFetch(`${DMS_BASE}/documents/pending-removals`);
    },

    // ── ANNOTATIONS & NOTES ──
    async getMyAnnotations(params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`${DMS_BASE}/documents/my-annotations${query ? `?${query}` : ''}`);
    },

    async getAnnotations(documentId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`${DMS_BASE}/documents/${documentId}/annotations${query ? `?${query}` : ''}`);
    },

    async createAnnotation(documentId, data) {
        return apiFetch(`${DMS_BASE}/documents/${documentId}/annotations`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateAnnotation(documentId, annotationId, data) {
        return apiFetch(`${DMS_BASE}/documents/${documentId}/annotations/${annotationId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteAnnotation(documentId, annotationId) {
        return apiFetch(`${DMS_BASE}/documents/${documentId}/annotations/${annotationId}`, {
            method: 'DELETE',
        });
    },

    // ── SECTIONS ──
    async getTemplates(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${DMS_BASE}/templates${query ? `?${query}` : ''}`;
        return apiFetch(endpoint);
    },

    async getTemplateCategories(search = '') {
        const q = search ? `?search=${encodeURIComponent(search)}` : '';
        return apiFetch(`${DMS_BASE}/templates/categories${q}`);
    },

    async getTemplateById(id) {
        return apiFetch(`${DMS_BASE}/templates/${id}`);
    },

    async createTemplate(data) {
        return apiFetch(`${DMS_BASE}/templates`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateTemplate(id, data) {
        return apiFetch(`${DMS_BASE}/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async reviewTemplate(id, action, rejection_reason = null) {
        return apiFetch(`${DMS_BASE}/templates/${id}/approval`, {
            method: 'PATCH',
            body: JSON.stringify({ action, rejection_reason }),
        });
    },

    async cloneTemplate(id, data) {
        return apiFetch(`${DMS_BASE}/templates/${id}/clone`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteTemplate(id) {
        return apiFetch(`${DMS_BASE}/templates/${id}`, {
            method: 'DELETE',
        });
    },

    // ── VERSION CONTROL ──
    async createRevision(docId, data = {}) {
        return apiFetch(`${DMS_BASE}/documents/${docId}/create-revision`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async submitRevision(docId, { commit_message } = {}) {
        return apiFetch(`${DMS_BASE}/documents/${docId}/submit-revision`, {
            method: 'POST',
            body: JSON.stringify({ commit_message }),
        });
    },

    async discardRevision(docId) {
        return apiFetch(`${DMS_BASE}/documents/${docId}/discard-revision`, {
            method: 'POST',
        });
    },

    async saveSectionEdits(docId, sections, { commit_message, isDraftOnly = true } = {}) {
        return apiFetch(`${DMS_BASE}/documents/${docId}/sections`, {
            method: 'PUT',
            body: JSON.stringify({ sections, commit_message, isDraftOnly }),
        });
    },

    async getVersionHistory(docId) {
        return apiFetch(`${DMS_BASE}/documents/${docId}/versions`);
    },

    async getVersionSections(docId, versionId) {
        return apiFetch(`${DMS_BASE}/documents/${docId}/versions/${versionId}/sections`);
    },
};
