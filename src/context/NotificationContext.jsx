/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
    requestFcmToken,
    onForegroundMessage,
    showSystemNotification,
    getNotificationsApi,
    markAsReadApi,
    markAllAsReadApi,
    deleteNotificationApi,
    sendDemoNotificationApi,
} from '../services/notification.service';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fcmToken, setFcmToken] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState(
        typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission
            : 'unsupported'
    );

    const prevUnreadCountRef = useRef(null);
    const initialFetchDoneRef = useRef(false);

    // Fetch user notifications and unread counter from backend
    const fetchNotifications = useCallback(async (isSilent = false) => {
        if (!isAuthenticated) return;
        if (!isSilent) setLoading(true);

        try {
            const res = await getNotificationsApi({ limit: 30 });
            if (res?.data) {
                const newItems = res.data.notifications || [];
                const newUnread = Number(res.data.unreadCount || 0);

                // Fire OS system notification when a new unread arrives in real-time
                if (
                    initialFetchDoneRef.current &&
                    prevUnreadCountRef.current !== null &&
                    newUnread > prevUnreadCountRef.current
                ) {
                    const latest = newItems[0];
                    if (latest && !latest.is_read) {
                        showSystemNotification(latest.title, {
                            body: latest.body,
                            data: latest.data,
                        });
                    }
                }

                prevUnreadCountRef.current = newUnread;
                initialFetchDoneRef.current = true;

                setNotifications(newItems);
                setUnreadCount(newUnread);
            }
        } catch (err) {
            console.error('[NotificationContext] Error fetching notifications:', err.message);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [isAuthenticated]);

    // Enable notifications & register FCM token
    const enableNotifications = async () => {
        try {
            const token = await requestFcmToken();
            if (token) {
                setFcmToken(token);
                setPermissionStatus('granted');
                return { success: true, token };
            }
            if ('Notification' in window) {
                setPermissionStatus(Notification.permission);
            }
            return { success: false, reason: 'permission_not_granted' };
        } catch (err) {
            console.error('[NotificationContext] Failed to enable notifications:', err);
            return { success: false, error: err.message };
        }
    };

    // Mark single notification as read
    const markAsRead = async (id) => {
        try {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((c) => Math.max(c - 1, 0));
            prevUnreadCountRef.current = Math.max((prevUnreadCountRef.current || 1) - 1, 0);

            await markAsReadApi(id);
        } catch (err) {
            console.error('[NotificationContext] Failed to mark as read:', err.message);
            fetchNotifications(true);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            prevUnreadCountRef.current = 0;
            await markAllAsReadApi();
        } catch (err) {
            console.error('[NotificationContext] Failed to mark all read:', err.message);
            fetchNotifications(true);
        }
    };

    // Delete single notification
    const deleteNotification = async (id) => {
        try {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            await deleteNotificationApi(id);
        } catch (err) {
            console.error('[NotificationContext] Failed to delete notification:', err.message);
            fetchNotifications(true);
        }
    };

    // Trigger demo test notification to verify pipeline
    const sendTestNotification = async (params = {}) => {
        const testTitle = params.title || '🔔 LibList Test Alert';
        const testBody =
            params.body ||
            `Real-time notification received at ${new Date().toLocaleTimeString()}!`;

        // Fire native OS system notification immediately
        showSystemNotification(testTitle, { body: testBody });

        try {
            const result = await sendDemoNotificationApi({
                title: testTitle,
                body: testBody,
                ...params,
            });

            // Refresh list & badge counter after sending
            await fetchNotifications(true);
            return result;
        } catch (err) {
            console.error('[NotificationContext] Test notification error:', err.message);
            throw err;
        }
    };

    // Initial load, FCM registration, real-time polling, foreground listeners
    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            setFcmToken(null);
            prevUnreadCountRef.current = null;
            initialFetchDoneRef.current = false;
            return;
        }

        // 1. Initial fetch
        fetchNotifications(false);

        // 2. Auto-enable FCM token if permission already granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            enableNotifications();
        }

        // 3. Listen for foreground Firebase push messages
        let unsubscribeFCM = null;
        onForegroundMessage((payload) => {
            const title = payload.notification?.title || payload.data?.title || 'New Notification';
            const body = payload.notification?.body || payload.data?.body || '';

            // Fire native OS system notification
            showSystemNotification(title, { body, data: payload.data });

            // Refresh list & counter
            fetchNotifications(true);
        }).then((unsub) => {
            unsubscribeFCM = unsub;
        });

        // 4. Poll every 6 seconds so badge updates without page refresh
        const pollInterval = setInterval(() => {
            fetchNotifications(true);
        }, 6000);

        // 5. Instant refresh on tab focus or visibility change
        const handleWindowFocus = () => {
            fetchNotifications(true);
        };
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('visibilitychange', handleWindowFocus);

        return () => {
            clearInterval(pollInterval);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('visibilitychange', handleWindowFocus);
            if (typeof unsubscribeFCM === 'function') {
                unsubscribeFCM();
            }
        };
    }, [isAuthenticated, fetchNotifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fcmToken,
                permissionStatus,
                enableNotifications,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                sendTestNotification,
                showSystemNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
