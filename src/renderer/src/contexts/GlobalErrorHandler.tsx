import React, { useEffect } from 'react';
import { useToast } from './ToastContext';

export const GlobalErrorHandler: React.FC = () => {
    useEffect(() => {
        const handleGlobalError = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
            console.error("Global Error:", event, source, lineno, colno, error);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error("Unhandled Promise Rejection:", event.reason);
        };

        window.onerror = handleGlobalError;
        window.onunhandledrejection = handleUnhandledRejection;

        return () => {
            window.onerror = null;
            window.onunhandledrejection = null;
        };
    }, []);

    return null;
};