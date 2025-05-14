import React from 'react';
import { useNotification } from './NotificationContext';

interface ErrorBoundaryProps {
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Dodaj powiadomienie o błędzie
        this.props.onError?.(error, errorInfo);
    }

    render() {
        return this.props.children;
    }
}

export const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addNotification } = useNotification();

    const handleError = (error: Error) => {
        addNotification(
            'error',
            `Error: ${error.message}`,
            {
                reason: error,
                source: 'ErrorBoundary',
                toast: false,
            }
        );
    };

    return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
};