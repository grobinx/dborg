import React, { useEffect } from 'react';
import { useNotification } from './NotificationContext';

export const GlobalErrorHandler: React.FC = () => {
    const { addNotification } = useNotification();

    useEffect(() => {
        const handleGlobalError = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
            addNotification(
                'error',
                `Global Error: ${error?.message || (typeof event === 'string' ? event : 'Unknown error')}`,
                {
                    reason: {
                        error,
                        event,
                        source,
                        lineno,
                        colno,
                    },
                    source: 'GlobalErrorHandler',
                    toast: false,
                }
            );
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            addNotification(
                'error',
                `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
                {
                    reason: event.reason,
                    source: 'GlobalErrorHandler',
                    toast: false,
                }
            );
        };

        window.onerror = handleGlobalError;
        window.onunhandledrejection = handleUnhandledRejection;

        return () => {
            window.onerror = null;
            window.onunhandledrejection = null;
        };
    }, [addNotification]);

    return null; // Komponent nie renderuje niczego
};