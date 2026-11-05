/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
    loginApi,
    logoutApi,
    refreshSession,
    getUser as getStoredUser,
    getAccessToken,
    getRememberMe,
    clearAuth,
    checkemailavailability
} from '../services/auth.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const isRemembered = getRememberMe();
            const token = getAccessToken();
            const stored = getStoredUser();

            if (token && stored) {
                // Valid session found in storage (sessionStorage or localStorage depending on rememberMe)
                setUser(stored);
                setIsAuthenticated(true);
            } else if (token && !stored) {
                // Token exists but no user data — clear stale state
                clearAuth();
                setUser(null);
                setIsAuthenticated(false);
            } else if (!isRemembered) {
                // Not remembered + no active session → force login
                clearAuth();
                setUser(null);
                setIsAuthenticated(false);
            } else {
                // Remembered but no token — try silent refresh via cookie
                const refreshed = await refreshSession();
                if (refreshed) {
                    const freshUser = getStoredUser();
                    setUser(freshUser);
                    setIsAuthenticated(true);
                } else {
                    clearAuth();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (credentials) => {
        const response = await loginApi(credentials);
        const loggedUser = response?.data?.user || response?.user || getStoredUser();
        setUser(loggedUser);
        setIsAuthenticated(true);
        return response;
    };

    const logout = async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuth();
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const checkuserEmailAvailability = async (email) => {
        return await checkemailavailability(email);
    };

    const hasPermission = (moduleName, operationName = 'read') => {
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        const required = `${moduleName.toLowerCase()}:${operationName.toLowerCase()}`;
        return (user.permissions || []).includes(required);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                logout,
                refreshSession,
                checkuserEmailAvailability,
                hasPermission
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
