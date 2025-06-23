import React, { useContext } from 'react';
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

const AppWrapper: React.FC = () => {
    const settingsContext = useContext(SettingsContext);

    if (!settingsContext || settingsContext.isLoading) {
        // Wyświetl ekran ładowania, dopóki ustawienia nie zostaną załadowane
        return <div>Loading...</div>;
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
