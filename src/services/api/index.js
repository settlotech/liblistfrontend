import { API_BASE, apiFetch } from './baseApi';
import { departmentApi } from './departmentApi';
import { policyApi } from './policyApi';
import { makerCheckerApi } from './makerCheckerApi';
import { changeLogApi } from './changeLogApi';
import { metricsApi } from './metricsApi';
import { usersApi } from './usersApi';
import { templatesApi } from './templatesApi';
import { tasksApi } from './tasksApi';
import { taskApi } from './taskApi';
import { authApi } from './authApi';
import { aiApi } from './aiApi';

export {
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
};

export const api = {
  ...departmentApi,
  ...policyApi,
  ...makerCheckerApi,
  ...changeLogApi,
  ...metricsApi,
  ...usersApi,
  ...templatesApi,
  ...tasksApi,
  ...authApi,
  ...aiApi
};

export default api;

