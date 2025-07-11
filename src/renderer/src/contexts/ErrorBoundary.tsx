import React from 'react';
import { useToast } from './ToastContext';

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

    const handleError = (error: Error) => {
        console.error("Error caught in ErrorBoundary:", error);
    };

    return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
};