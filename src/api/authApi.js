import api from '../api/axiosInstance';

export const loginApi = async ({ email, password, rememberMe }) => {
  const { data } = await api.post('/auth/login', { email, password, rememberMe });
  return data;
};

export const logoutApi = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const getMeApi = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const forgotPasswordApi = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const verifyOtpApi = async ({ email, otp }) => {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  return data;
};

export const resetPasswordApi = async ({ resetToken, newPassword, confirmPassword }) => {
  const { data } = await api.post('/auth/reset-password', { resetToken, newPassword, confirmPassword });
  return data;
};

export const changePasswordApi = async ({ currentPassword, newPassword }) => {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
};

export const updateProfileApi = async ({ name }) => {
  const { data } = await api.put('/auth/profile', { name });
  return data;
};
