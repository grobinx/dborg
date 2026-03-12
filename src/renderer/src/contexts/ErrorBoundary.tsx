import React from "react";
import logo from '../assets/img/orbada128.png';

interface ErrorBoundaryProps {
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "28px 16px",
        background: "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)",
        color: "#0f172a",
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
    },
    card: {
        width: "100%",
        maxWidth: 900,
        background: "rgba(255,255,255,0.96)",
        border: "1px solid #dbeafe",
        borderRadius: 16,
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.14)",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 22px",
        borderBottom: "1px solid #fecaca",
        background: "linear-gradient(90deg, #fff1f2 0%, #fee2e2 100%)",
    },
    iconBubble: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#dc2626",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: 18,
        flexShrink: 0,
    },
    title: {
        margin: 0,
        fontSize: 21,
        fontWeight: 700,
        lineHeight: 1.2,
        color: "#991b1b",
    },
    subtitle: {
        margin: "6px 0 0",
        fontSize: 14,
        color: "#7f1d1d",
    },
    body: {
        padding: "20px 22px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },
    sectionLabel: {
        margin: 0,
        fontSize: 12,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: "#64748b",
        fontWeight: 700,
    },
    messageBox: {
        margin: 0,
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        background: "#ffffff",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontSize: 14,
        lineHeight: 1.5,
        color: "#0f172a",
    },
    details: {
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        background: "#f8fafc",
        padding: "8px 12px",
    },
    summary: {
        cursor: "pointer",
        fontWeight: 600,
        color: "#1e293b",
        userSelect: "none",
    },
    code: {
        margin: "10px 0 0",
        padding: "10px 12px",
        borderRadius: 8,
        background: "#0f172a",
        color: "#e2e8f0",
        border: "1px solid #1e293b",
        maxHeight: 300,
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 12,
        lineHeight: 1.45,
    },
    actions: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    buttonPrimary: {
        padding: "10px 16px",
        borderRadius: 10,
        border: "1px solid #1d4ed8",
        background: "#2563eb",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
    },
    hint: {
        margin: 0,
        fontSize: 12,
        color: "#475569",
    },
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: undefined, errorInfo: undefined };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ hasError: true, error, errorInfo });
        this.props.onError?.(error, errorInfo);
    }

    private formatErrorDetails(): string {
        const { error, errorInfo } = this.state;
        if (!error) {
            return "No error details available.";
        }

        const extraEntries = Object.entries(error)
            .filter(([key]) => key !== "name" && key !== "message" && key !== "stack")
            .map(([key, value]) => `${key}: ${String(value)}`);

        return [
            `name: ${error.name}`,
            `message: ${error.message}`,
            ...extraEntries,
            error.stack ? `\nstack:\n${error.stack}` : "",
            errorInfo?.componentStack ? `\ncomponentStack:\n${errorInfo.componentStack}` : "",
        ]
            .filter(Boolean)
            .join("\n");
    }

    render() {
        if (this.state.hasError) {
            const { error } = this.state;

            return (
                <div style={styles.page}>
                    <div style={styles.card}>
                        <div style={styles.header}>
                            <div style={styles.iconBubble}>!</div>
                            <div>
                                <h2 style={styles.title}>Application Error</h2>
                                <p style={styles.subtitle}>
                                    Fallback view is active.
                                </p>
                            </div>
                            <img src={logo} alt="Logo" style={{ width: 32, height: 32, marginLeft: "auto", opacity: 0.8 }} />
                        </div>

                        <div style={styles.body}>
                            <p style={styles.sectionLabel}>Message</p>
                            <pre style={styles.messageBox}>{error?.message ?? "Unknown error."}</pre>

                            {error && (
                                <details style={styles.details}>
                                    <summary style={styles.summary}>Error details</summary>
                                    <pre style={styles.code}>{this.formatErrorDetails()}</pre>
                                </details>
                            )}

                            <div style={styles.actions}>
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    style={styles.buttonPrimary}
                                >
                                    Reload application
                                </button>
                            </div>

                            <p style={styles.hint}>
                                If the issue persists, check logs and report it with the stack trace.
                            </p>
                        </div>
                    </div>
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