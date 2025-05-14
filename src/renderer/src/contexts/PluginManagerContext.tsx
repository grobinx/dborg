import PluginManager, { PluginManagerBase } from '../../../../plugins/manager/renderer/PluginManager';
import React, { createContext, useContext, useRef } from 'react';
import { useDatabase } from './DatabaseContext';
import PostgresPlugin from '../../../../plugins/pg/renderer/PostgresPlugin'

const PluginManagerContext = createContext<PluginManagerBase | null>(null);

export const PluginManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pluginManagerRef = useRef(new PluginManager());
    const { internal } = useDatabase();

    React.useEffect(() => {
        pluginManagerRef.current.registerPlugin(PostgresPlugin, internal);
    }, [internal]);

    return (
        <PluginManagerContext.Provider value={pluginManagerRef.current}>
            {children}
        </PluginManagerContext.Provider>
    );
};

export const usePluginManager = (): PluginManagerBase => {
    const context = useContext(PluginManagerContext);
    if (!context) {
        throw new Error('usePluginManager must be used within a PluginManagerProvider');
    }
    return context;
};
