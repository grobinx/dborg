import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './i18n';
import './app.config';
import { DialogsProvider } from '@toolpad/core';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { SettingsContext, SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { MessageProvider } from './contexts/MessageContext';
import ToastList from './components/notifications/ToastList';
import ThemeWrapper from './themes/ThemeWrapper';
import { ApplicationProvider } from './contexts/ApplicationContext';
import { PluginManagerProvider } from './contexts/PluginManagerContext';
import { ErrorBoundaryWrapper } from './contexts/ErrorBoundary';
import { GlobalErrorHandler } from './contexts/GlobalErrorHandler';
import About from './About';
import { QueryHistoryProvider } from './contexts/QueryHistoryContext';
import { ConsoleProvider } from './contexts/ConsoleContext';
import { SchemaProvider } from './contexts/SchemaContext';

const AppWrapper: React.FC = () => {
    const settingsContext = React.useContext(SettingsContext);
    const [pause, setPause] = React.useState(true);

    useEffect(() => {
        setTimeout(() => {
            // Ustawienie pauzy na false po załadowaniu ustawień
            setPause(false);
        }, 3000);
    }, [settingsContext?.isLoading]);

    if (!settingsContext || settingsContext.isLoading || pause) {
        return (
            <ThemeWrapper>
                <div style={{ height: '100vh', width: '100vw' }}>
                    <About loading={true} />
                </div>
            </ThemeWrapper>
        );
    }

    return (
        <ToastProvider>
            <ErrorBoundaryWrapper>
                <GlobalErrorHandler />
                <DatabaseProvider>
                    <ThemeWrapper>
                        <DialogsProvider>
                            <ToastList />
                            <SchemaProvider>
                                <PluginManagerProvider>
                                    <ApplicationProvider>
                                        <QueryHistoryProvider>
                                            <App />
                                        </QueryHistoryProvider>
                                    </ApplicationProvider>
                                </PluginManagerProvider>
                            </SchemaProvider>
                        </DialogsProvider>
                    </ThemeWrapper>
                </DatabaseProvider>
            </ErrorBoundaryWrapper>
        </ToastProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <ConsoleProvider>
            <MessageProvider>
                <SettingsProvider>
                    <AppWrapper />
                </SettingsProvider>
            </MessageProvider>
        </ConsoleProvider>
    </React.StrictMode>
);
