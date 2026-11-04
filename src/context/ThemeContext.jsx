/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserSettingsApi, updateUserSettingsApi } from '../services/setting.service';
import { useAuth } from './AuthContext';

export const ThemeContext = createContext(null);

const DEFAULT_THEME = 'light';
const DEFAULT_BUTTON_COLOR = '#0057B8';

// Helper to generate a slightly darker hover shade for buttons
const getHoverColor = (hex) => {
    try {
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        const num = parseInt(cleanHex, 16);
        const r = Math.max(0, (num >> 16) - 25);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - 25);
        const b = Math.max(0, (num & 0x0000FF) - 25);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch {
        return hex;
    }
};

export const ThemeProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // 1. Local state (initialized from localStorage for instant flicker-free render)
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem('app_theme') || DEFAULT_THEME;
    });

    const [buttonColor, setButtonColorState] = useState(() => {
        return localStorage.getItem('app_button_color') || DEFAULT_BUTTON_COLOR;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    // 2. Resolve 'system' theme dynamically
    const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // Listen to OS system theme changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setSystemPrefersDark(e.matches);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);

    const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

    // 3. Apply CSS variables and data-theme to document
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', resolvedTheme);
        root.style.setProperty('--btn-primary-bg', buttonColor);
        root.style.setProperty('--btn-primary-hover', getHoverColor(buttonColor));
        root.style.setProperty('--primary-color', buttonColor);
    }, [resolvedTheme, buttonColor]);

    // 4. Fetch user preferences from DB when authenticated
    useEffect(() => {
        if (!isAuthenticated) return;

        let isMounted = true;
        const fetchRemoteSettings = async () => {
            try {
                const settings = await getUserSettingsApi();
                if (!isMounted || !settings) return;

                if (settings.theme) {
                    setThemeState(settings.theme);
                    localStorage.setItem('app_theme', settings.theme);
                }
                if (settings.button_color) {
                    setButtonColorState(settings.button_color);
                    localStorage.setItem('app_button_color', settings.button_color);
                }
                setIsSynced(true);
            } catch (err) {
                console.warn('Could not sync user theme from database:', err.message);
            }
        };

        fetchRemoteSettings();
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated]);

    // 5. Update and persist settings (both locally and to PostgreSQL database)
    const saveThemeSettings = useCallback(async (newTheme, newButtonColor) => {
        const targetTheme = newTheme || theme;
        const targetColor = newButtonColor || buttonColor;

        setThemeState(targetTheme);
        setButtonColorState(targetColor);
        localStorage.setItem('app_theme', targetTheme);
        localStorage.setItem('app_button_color', targetColor);

        if (isAuthenticated) {
            setIsSaving(true);
            try {
                await updateUserSettingsApi({
                    theme: targetTheme,
                    button_color: targetColor
                });
                setIsSynced(true);
            } catch (err) {
                console.error('Failed to persist settings to backend:', err);
            } finally {
                setIsSaving(false);
            }
        }
    }, [theme, buttonColor, isAuthenticated]);

    const setTheme = (newTheme) => {
        saveThemeSettings(newTheme, buttonColor);
    };

    const setButtonColor = (newColor) => {
        saveThemeSettings(theme, newColor);
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                buttonColor,
                resolvedTheme,
                isSaving,
                isSynced,
                setTheme,
                setButtonColor,
                saveThemeSettings
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
