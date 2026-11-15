import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../config/firebase';
import { apiFetch } from './auth.service';

/**
 * Trigger local browser system notification (Windows / macOS / Android OS notification)
 */
export const showSystemNotification = (title, options = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        const notifOptions = {
            body: options.body || '',
            icon: options.icon || '/favicon.svg',
            badge: options.badge || '/favicon.svg',
            tag: options.tag || `liblist-${Date.now()}`,
            data: options.data || {},
            ...options,
        };

        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready
                    .then((reg) => {
                        reg.showNotification(title, notifOptions);
                    })
                    .catch(() => {
                        new Notification(title, notifOptions);
                    });
            } else {
                new Notification(title, notifOptions);
            }
        } catch (err) {
            console.warn('[System Notification] Fallback error:', err);
        }
    }
};

/**
 * Register Service Worker and retrieve FCM Web Push Registration Token
 */
export const requestFcmToken = async () => {
    try {
        if (!('Notification' in window)) {
            console.warn('Notifications are not supported in this browser.');
            return null;
        }

        const permission = await Notification.requestPermission(); 
        if (permission !== 'granted') {
            console.log('Notification permission denied or dismissed:', permission);
            return null;
        }

        const messaging = await getFirebaseMessaging();
        if (!messaging) {
            console.warn('Firebase messaging is not supported in this environment.');
            return null;
        }

        // Register the firebase messaging service worker
        let swRegistration = null;
        if ('serviceWorker' in navigator) {
            swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const currentToken = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swRegistration || undefined,
        });

        if (currentToken) {
            console.log('[FCM] Registration token retrieved successfully.');
            // Send token to backend to persist in PostgreSQL
            await saveFcmTokenApi(currentToken);
            return currentToken;
        } else {
            console.warn('[FCM] No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.error('[FCM] An error occurred while retrieving token:', err);
        return null;
    }
};

//  Listen for real-time foreground messages when tab is open and active
 
export const onForegroundMessage = async (callback) => {
    try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return () => {};

        return onMessage(messaging, (payload) => {
            console.log('[FCM] Foreground notification received:', payload);
            if (typeof callback === 'function') {
                callback(payload);
            }
        });
    } catch (err) {
        console.error('[FCM] Error setting up foreground message listener:', err);
        return () => {};
    }
};

 
export const saveFcmTokenApi = async (fcm_token, device_info = '') => {
    const response = await apiFetch('/notifications/fcm-token', {
        method: 'POST',
        body: JSON.stringify({
            fcm_token,
            device_info: device_info || navigator.userAgent || 'Web Browser',
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to save FCM token');
    }
    return data;
};

 
export const removeFcmTokenApi = async (fcm_token) => {
    const response = await apiFetch('/notifications/fcm-token', {
        method: 'DELETE',
        body: JSON.stringify({ fcm_token }),
    });
    const data = await response.json();
    return data;
};

 
export const getNotificationsApi = async ({ limit = 30, offset = 0, unreadOnly = false } = {}) => {
    const query = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        unreadOnly: String(unreadOnly),
    });
    const response = await apiFetch(`/notifications?${query.toString()}`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
    }
    return data;
};

 
export const markAsReadApi = async (notificationId) => {
    const response = await apiFetch(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notification as read');
    }
    return data;
};

 
export const markAllAsReadApi = async () => {
    const response = await apiFetch('/notifications/read-all', {
        method: 'PATCH',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to mark all as read');
    }
    return data;
};

 
export const deleteNotificationApi = async (notificationId) => {
    const response = await apiFetch(`/notifications/${notificationId}`, {
        method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete notification');
    }
    return data;
};

 
export const sendDemoNotificationApi = async ({ title, body, data } = {}) => {
    const response = await apiFetch('/notifications/demo-send', {
        method: 'POST',
        body: JSON.stringify({ title, body, data }),
    });
    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData.message || 'Failed to send demo notification');
    }
    return resData;
};
