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
import SchemaConnectionManager from './app/SchemaConnectionManager';
import ToastList from './components/notifications/ToastList';
import ThemeWrapper from './themes/ThemeWrapper';
import { ApplicationProvider } from './contexts/ApplicationContext';
import { PluginManagerProvider } from './contexts/PluginManagerContext';
import { ErrorBoundaryWrapper } from './contexts/ErrorBoundary';
import { GlobalErrorHandler } from './contexts/GlobalErrorHandler';
import About from './About';
import { QueryHistoryProvider } from './contexts/QueryHistoryContext';
import { ConsoleProvider } from './contexts/ConsoleContext';

const AppWrapper: React.FC = () => {
    const settingsContext = React.useContext(SettingsContext);
    const [pause, setPause] = React.useState(true);

    useEffect(() => {
        setTimeout(() => {
            // Ustawienie pauzy na false po załadowaniu ustawień
            setPause(false);
        }, 2000);
    }, [settingsContext.isLoading]);

    if (!settingsContext || settingsContext.isLoading || pause) {
        // Wyświetl ekran ładowania, dopóki ustawienia nie zostaną załadowane
        return (
            <ThemeWrapper>
                <About loading={true} />
            </ThemeWrapper>
        );
    }

    return (
        <ToastProvider>
            <ErrorBoundaryWrapper>
                <GlobalErrorHandler />
                <MessageProvider>
                    <DatabaseProvider>
                        <ThemeWrapper>
                            <DialogsProvider>
                                <ToastList />
                                <SchemaConnectionManager />
                                <PluginManagerProvider>
                                    <ApplicationProvider>
                                        <QueryHistoryProvider>
                                            <App />
                                        </QueryHistoryProvider>
                                    </ApplicationProvider>
                                </PluginManagerProvider>
                            </DialogsProvider>
                        </ThemeWrapper>
                    </DatabaseProvider>
                </MessageProvider>
            </ErrorBoundaryWrapper>
        </ToastProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <ConsoleProvider>
            <SettingsProvider>
                <AppWrapper />
            </SettingsProvider>
        </ConsoleProvider>
    </React.StrictMode>
);
