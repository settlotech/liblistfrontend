import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchDashboardOverview } from '../services/dashboard.service';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [departmentId, setDepartmentId] = useState('all');
    const [timeRange, setTimeRange] = useState('30d');
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadMetrics = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const data = await fetchDashboardOverview({
                department_id: departmentId,
                time_range: timeRange
            });
            setMetrics(data);
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
