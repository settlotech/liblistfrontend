/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi, refreshSession, getUser as getStoredUser, getAccessToken, clearAuth, checkemailavailability } from '../services/auth.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            return getStoredUser() || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('libtrak_authenticated_user') || 'null') : null);
        } catch (_) {
            return null;
        }
    });

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        try {
            const token = getAccessToken();
            const stored = getStoredUser() || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('libtrak_authenticated_user') || 'null') : null);
            return Boolean(token && stored);
        } catch (_) {
            return false;
        }
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = getAccessToken();
            const stored = getStoredUser() || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('libtrak_authenticated_user') || 'null') : null);

            if (token && stored) {
                // Active session found from storage
                setUser(stored);
                setIsAuthenticated(true);
            } else {
                // No active credentials; start unauthenticated
                setUser(null);
                setIsAuthenticated(false);
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
