import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchDashboardOverview, fetchDashboardChangeManagement, fetchActivityTimeline } from '../services/dashboard.service';
import { useAuth } from './AuthContext';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [changeManagement, setChangeManagement] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [departmentId, setDepartmentId] = useState('all');
    const [timeRange, setTimeRange] = useState('30d');
    const [lastUpdated, setLastUpdated] = useState(null);

    // Reset all state when the logged-in user changes (role switch after logout)
    useEffect(() => {
        setMetrics(null);
        setChangeManagement(null);
        setRecentActivity([]);
        setError(null);
        setLastUpdated(null);
    }, [user?.id]);

    const loadMetrics = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const [overviewData, cmData, activityData] = await Promise.all([
                fetchDashboardOverview({ department_id: departmentId, time_range: timeRange }),
                fetchDashboardChangeManagement().catch(() => null),
                fetchActivityTimeline(7).catch(() => []),
            ]);
            setMetrics(overviewData);
            setChangeManagement(cmData);
            setRecentActivity(activityData || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to load dashboard metrics:', err);
            setError(err.message || 'Unable to connect to dashboard service.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [departmentId, timeRange]);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    const refreshDashboard = () => loadMetrics(true);

    return (
        <DashboardContext.Provider
            value={{
                metrics,
                changeManagement,
                recentActivity,
                loading,
                isRefreshing,
                error,
                departmentId,
                setDepartmentId,
                timeRange,
                setTimeRange,
                refreshDashboard,
                lastUpdated
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
