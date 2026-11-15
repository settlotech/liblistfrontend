/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { loginApi, logoutApi, getMeApi } from '../api/authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
      const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (token && savedUser) return JSON.parse(savedUser);
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Re-verify session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

      if (token) {
        try {
          const res = await getMeApi();
          const fetchedUser = res?.data?.user || res?.data;
          if (isMounted && fetchedUser) {
            setUser(fetchedUser);
            // Store in same storage the token is in
            if (sessionStorage.getItem('accessToken')) {
              sessionStorage.setItem('user', JSON.stringify(fetchedUser));
            } else {
              localStorage.setItem('user', JSON.stringify(fetchedUser));
            }
          }
        } catch {
          if (isMounted) {
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } else {
        // Try refreshing via cookie
        try {
          const { data } = await axios.post(
            `${API_BASE}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          const newToken = data?.data?.accessToken;
          if (newToken && isMounted) {
            sessionStorage.setItem('accessToken', newToken);
            const userRes = await getMeApi();
            const fetchedUser = userRes?.data?.user || userRes?.data;
            if (isMounted && fetchedUser) {
              setUser(fetchedUser);
              sessionStorage.setItem('user', JSON.stringify(fetchedUser));
            }
          }
        } catch {
          if (isMounted) {
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }

      if (isMounted) setInitializing(false);
    };

    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const res = await loginApi(credentials);
      if (res?.data) {
        const { accessToken, user: loggedUser } = res.data;
        // If rememberMe → localStorage, else sessionStorage
        const storage = credentials.rememberMe ? localStorage : sessionStorage;
        storage.setItem('accessToken', accessToken);
        storage.setItem('user', JSON.stringify(loggedUser));
        storage.setItem('libtrak_access_token', accessToken);
        storage.setItem('libtrak_authenticated_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch { /* silent */ }
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await getMeApi();
      const fetchedUser = res?.data?.user || res?.data;
      if (fetchedUser) {
        setUser(fetchedUser);
        const storage = sessionStorage.getItem('accessToken') ? sessionStorage : localStorage;
        storage.setItem('user', JSON.stringify(fetchedUser));
      }
    } catch {
      setUser(null);
    }
  }, []);

  /**
   * hasPermission('roles', 'read')
   * SuperAdmins always pass. Others must have 'module:operation' in permissions array.
   */
  const hasPermission = useCallback((moduleName, operationName = 'read') => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const required = `${moduleName.toLowerCase()}:${operationName.toLowerCase()}`;
    return (user.permissions || []).includes(required);
  }, [user]);

  /**
   * Check if an email is available / exists in the system
   * Used by Forgot Password flow
   */
  const checkuserEmailAvailability = useCallback(async (email) => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/users/checkemailid`,
        { email },
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Email check failed.' };
    }
  }, []);

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loading,
        initializing,
        isLoading: initializing,
        login,
        logout,
        fetchMe,
        hasPermission,
        checkuserEmailAvailability,
        refreshSession: fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
