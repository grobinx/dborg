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
import { ProfilesProvider } from './contexts/ProfilesContext';
import RectangleDoor from './effects/RectangleDoor';

const AppWrapper: React.FC = () => {
    const settingsContext = React.useContext(SettingsContext);
    const [initStep, setInitStep] = React.useState(1);

    useEffect(() => {
        setTimeout(() => {
            // Ustawienie pauzy na false po załadowaniu ustawień
            setInitStep(2);
        }, 3200);
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
                            setTimeout(() => {
                                setInitStep(3);
                            }, 0);
                        }
                        else if (initStep === 3) {
                            setTimeout(() => {
                                setInitStep(4);
                            }, 0);
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
                    <DatabaseProvider>
                        <ThemeWrapper>
                            <DialogsProvider>
                                <ToastList />
                                <ProfilesProvider>
                                    <PluginManagerProvider>
                                        <ApplicationProvider>
                                            <QueryHistoryProvider>
                                                <App />
                                            </QueryHistoryProvider>
                                        </ApplicationProvider>
                                    </PluginManagerProvider>
                                </ProfilesProvider>
                            </DialogsProvider>
                        </ThemeWrapper>
                    </DatabaseProvider>
                </ToastProvider>
            )}
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <GlobalErrorHandler />
        <ErrorBoundaryWrapper>
            <ConsoleProvider>
                <MessageProvider>
                    <SettingsProvider>
                        <AppWrapper />
                    </SettingsProvider>
                </MessageProvider>
            </ConsoleProvider>
        </ErrorBoundaryWrapper>
    </React.StrictMode>
);
