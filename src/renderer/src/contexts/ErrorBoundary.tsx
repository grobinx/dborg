import React from 'react';
import { useToast } from './ToastContext';

interface ErrorBoundaryProps {
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean; error?: Error }> {
    state = { hasError: false, error: undefined };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ hasError: true, error });
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const { error } = this.state;
            return (
                <div style={{ padding: 24 }}>
                    <h2>Wystąpił błąd</h2>
                    <pre>{error?.["message"]}</pre>
                    {error && (
                        <details style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
                            <summary>Szczegóły błędu</summary>
                            <pre>
                                {Object.entries(error).map(([key, value]) =>
                                    `${key}: ${String(value)}\n`
                                )}
                                {error?.["stack"] && `stack:\n${error["stack"]}`}
                            </pre>
                        </details>
                    )}
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={{ marginTop: 12 }}
                    >
                        Odśwież
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const handleError = (error: Error) => {
        console.error("Error caught in ErrorBoundary:", error);
    };

    return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
};