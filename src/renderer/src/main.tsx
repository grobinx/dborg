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
import RectangleDoor from './effects/RectangleDoor';
import { init } from 'i18next';

const AppWrapper: React.FC = () => {
    const settingsContext = React.useContext(SettingsContext);
    const [initStep, setInitStep] = React.useState(1);

    useEffect(() => {
        setTimeout(() => {
            // Ustawienie pauzy na false po załadowaniu ustawień
            setInitStep(2);
        }, 3000);
    }, [settingsContext?.isLoading]);

    console.count("AppWrapper Render");

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            {initStep < 4 &&
                <RectangleDoor
                    key="door"
                    isOpen={initStep === 1 || initStep === 3}
                    //baseColor='#005500'
                    onAnimationEnd={() => { 
                        if (initStep === 2) {
                            setInitStep(3);
                        }
                        else if (initStep === 3) {
                            setInitStep(4);
                        }
                     }}
                />
            }
            {!settingsContext || settingsContext.isLoading || initStep <= 2 ? (
                <ThemeWrapper>
                    <div style={{ height: '100vh', width: '100vw' }}>
                        <About loading={true} />
                    </div>
                </ThemeWrapper>
            ) : (
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
            )}
        </div>
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
