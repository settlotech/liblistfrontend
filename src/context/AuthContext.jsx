/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi, refreshSession, getUser as getStoredUser, checkemailavailability } from '../services/auth.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const refreshed = await refreshSession();
                if (refreshed) {
                    setIsAuthenticated(true);
                    setUser(getStoredUser());
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (error) {
                console.error('Session check failed:', error);
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
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
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    };


    const hasPermission = (moduleName, operationName = 'read') => { 
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        const required = `${moduleName.toLowerCase()}:${operationName.toLowerCase()}`; 
        return (user.permissions || []).includes(required);
    };


    const hasRole = (...roles) => {
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        const userRoles = (user.roles || []).map(r => (typeof r === 'string' ? r : r.role_name).toLowerCase());
        if (user.role) userRoles.push(user.role.toLowerCase());
        return roles.some(role => userRoles.includes(role.toLowerCase()));
    };

    const checkuserEmailAvailability = async (email) => {
        const response = await checkemailavailability(email);
        return response;
    }
    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, checkuserEmailAvailability, login, logout, hasPermission, hasRole }}>
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
