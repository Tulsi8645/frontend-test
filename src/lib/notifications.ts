'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface NotificationState {
    permission: NotificationPermission;
    isSupported: boolean;
    isSubscribed: boolean;
}

interface NewSessionData {
    sessionId: string;
    channel: string;
    message?: string;
    userName?: string;
}

export function useNotifications() {
    const [state, setState] = useState<NotificationState>({
        permission: 'default',
        isSupported: false,
        isSubscribed: false,
    });
    const swRegistration = useRef<ServiceWorkerRegistration | null>(null);

    // Check notification support and permission on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        setState(prev => ({ 
            ...prev, 
            isSupported,
            permission: isSupported ? Notification.permission : 'default'
        }));

        if (isSupported) {
            registerServiceWorker();
        }
    }, []);

    // Register service worker
    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            swRegistration.current = registration;
            console.log('Service Worker registered:', registration);
            
            // Check if already subscribed
            const subscription = await registration.pushManager.getSubscription();
            setState(prev => ({
                ...prev,
                isSubscribed: !!subscription
            }));
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    };

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!state.isSupported) return false;

        try {
            const permission = await Notification.requestPermission();
            setState(prev => ({ ...prev, permission }));
            return permission === 'granted';
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }, [state.isSupported]);

    // Show local notification
    const showNotification = useCallback(async (data: NewSessionData) => {
        if (!state.isSupported || state.permission !== 'granted') {
            console.log('Notifications not permitted');
            return;
        }

        const channelLabels: Record<string, string> = {
            website: 'Website',
            facebook: 'Facebook',
            whatsapp: 'WhatsApp',
            instagram: 'Instagram'
        };

        const title = `New ${channelLabels[data.channel] || 'Chat'} Session`;
        const body = data.userName 
            ? `${data.userName}: ${data.message || 'Started a conversation'}`
            : data.message || 'A customer has started a conversation';

        const options: NotificationOptions = {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `session-${data.sessionId}`,
            requireInteraction: true,
            data: {
                sessionId: data.sessionId,
                channel: data.channel,
                url: `/admin/chats/${data.channel}?session=${data.sessionId}`
            }
        };

        // Service worker notification with actions
        const swOptions = {
            ...options,
            actions: [
                {
                    action: 'view',
                    title: 'View Chat'
                },
                {
                    action: 'close',
                    title: 'Dismiss'
                }
            ]
        };

        try {
            if (swRegistration.current) {
                await swRegistration.current.showNotification(title, swOptions);
            } else {
                new Notification(title, options);
            }
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }, [state.isSupported, state.permission]);

    return {
        ...state,
        requestPermission,
        showNotification
    };
}

// Hook for tracking notification badge count
export function useNotificationBadge() {
    const [unreadCount, setUnreadCount] = useState(0);

    const increment = useCallback(() => {
        setUnreadCount(prev => prev + 1);
        // Update document title
        if (typeof document !== 'undefined') {
            document.title = `(${unreadCount + 1}) Repair Bot Admin`;
        }
    }, [unreadCount]);

    const decrement = useCallback((count: number = 1) => {
        setUnreadCount(prev => {
            const newCount = Math.max(0, prev - count);
            if (typeof document !== 'undefined') {
                document.title = newCount > 0 
                    ? `(${newCount}) Repair Bot Admin` 
                    : 'Repair Bot Admin';
            }
            return newCount;
        });
    }, []);

    const clear = useCallback(() => {
        setUnreadCount(0);
        if (typeof document !== 'undefined') {
            document.title = 'Repair Bot Admin';
        }
    }, []);

    return {
        unreadCount,
        increment,
        decrement,
        clear
    };
}
