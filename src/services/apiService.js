import {
  API_BASE,
  apiFetch,
  departmentApi,
  policyApi,
  makerCheckerApi,
  changeLogApi,
  metricsApi,
  usersApi,
  templatesApi,
  tasksApi,
  taskApi,
  authApi,
  aiApi
} from './api/index';

/**
 * Unified API Service for LibTrak OmniSpec Hub
 * Re-exports all modular API functions for full backward compatibility across the frontend.
 */
export const apiService = {
  // Base configuration
  API_BASE,
  apiFetch,

  // 1. Hierarchy & Departments
  getHierarchy: departmentApi.getHierarchy,
  createDepartment: departmentApi.createDepartment,

  // 2. Policies & Governance
  getPolicies: policyApi.getPolicies,
  getPolicyDetails: policyApi.getPolicyDetails,
  createPolicy: policyApi.createPolicy,
  updatePolicy: policyApi.updatePolicy,
  togglePolicyStatus: policyApi.togglePolicyStatus,
  publishDraft: policyApi.publishDraft,
  togglePolicyMasking: policyApi.togglePolicyMasking,
  deletePolicy: policyApi.deletePolicy,
  addPolicyArtifact: policyApi.addPolicyArtifact,
  getPolicyArtifacts: policyApi.getPolicyArtifacts,

  // Version Control & Snapshots
  getPolicyVersions: policyApi.getPolicyVersions,
  restorePolicyVersion: policyApi.restorePolicyVersion,

  // Document Comments (DB Persistent)
  getPolicyComments: policyApi.getPolicyComments,
  postPolicyComment: policyApi.postPolicyComment,
  toggleCommentLike: policyApi.toggleCommentLike,
  updateCommentTaskStatus: policyApi.updateCommentTaskStatus,
  postCommentReply: policyApi.postCommentReply,

  // 3. Maker-Checker Governance & Approvals
  getMakerCheckerItems: makerCheckerApi.getMakerCheckerItems,
  createMakerCheckerItem: makerCheckerApi.createMakerCheckerItem,
  actionMakerChecker: makerCheckerApi.actionMakerChecker,
  reviewMakerCheckerItem: makerCheckerApi.actionMakerChecker,
  closeMakerCheckerItem: makerCheckerApi.closeMakerCheckerItem,

  // 4. Change Control Logs
  getChangeLogs: changeLogApi.getChangeLogs,

  // 5. Operational Dashboard Metrics
  getDashboardMetrics: metricsApi.getDashboardMetrics,

  // 6. Users & Multi-Tenant Roles (Admin Management)
  getUsers: usersApi.getUsers,
  getUserById: usersApi.getUserById,
  createUser: usersApi.createUser,
  updateUser: usersApi.updateUser,
  deleteUser: usersApi.deleteUser,

  // 7. Dynamic Starter Policy Templates
  getTemplates: templatesApi.getTemplates,
  getTemplateById: templatesApi.getTemplateById,
  createTemplate: templatesApi.createTemplate,

  // 8. Workflow Tasks & Assignments (APRA CPS 234 Tracking)
  getTasks: tasksApi.getTasks,
  createTask: tasksApi.createTask,
  updateTask: tasksApi.updateTask,
  deleteTask: tasksApi.deleteTask,
  taskApi,

  // 9. Institutional Authentication & JWT Session
  login: authApi.login,
  register: authApi.register,
  getProfile: authApi.getProfile,
  logout: authApi.logout,

  // 10. AI Document Ingestion & RAG
  ingestDocuments: aiApi.ingestDocuments,
  queryRag: aiApi.queryRag,
  getVectors: aiApi.getVectors
};

export default apiService;
