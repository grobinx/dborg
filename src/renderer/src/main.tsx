import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './i18n';
import './app.config';
import { DialogsProvider } from '@toolpad/core';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { SettingsContext, SettingsProvider } from './contexts/SettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';
import SchemaConnectionManager from './app/SchemaConnectionManager';
import NotificationToastList from './components/notifications/NotificationToastList';
import ThemeWrapper from './themes/ThemeWrapper';
import { ApplicationProvider } from './contexts/ApplicationContext';
import { PluginManagerProvider } from './contexts/PluginManagerContext';
import { ErrorBoundaryWrapper } from './contexts/ErrorBoundary';
import { GlobalErrorHandler } from './contexts/GlobalErrorHandler';
import About from './About';

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
        <NotificationProvider>
            <ErrorBoundaryWrapper>
                <GlobalErrorHandler />
                <MessageProvider>
                    <DatabaseProvider>
                        <ThemeWrapper>
                            <DialogsProvider>
                                <NotificationToastList />
                                <SchemaConnectionManager />
                                <PluginManagerProvider>
                                    <ApplicationProvider>
                                        <App />
                                    </ApplicationProvider>
                                </PluginManagerProvider>
                            </DialogsProvider>
                        </ThemeWrapper>
                    </DatabaseProvider>
                </MessageProvider>
            </ErrorBoundaryWrapper>
        </NotificationProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <SettingsProvider>
            <AppWrapper />
        </SettingsProvider>
    </React.StrictMode>
);
