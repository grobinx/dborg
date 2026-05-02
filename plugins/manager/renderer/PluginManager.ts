import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { RuntimePlugin, ConnectionViewsFactory, ConnectionView } from "./Plugin";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import * as monaco from "monaco-editor";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { ConnectionActions, ConnectionActionsFactory, ConnectionActionType, ConnectionSqlResultTab, ConnectionSqlResultTabFactory } from "./ConnectionSlots";

export interface IPluginManager {
    /**
     * Get session views for a given database session
     * @param session database session
     */
    getConnectionViews(session: IDatabaseSession): ConnectionView[] | null;

    /**
     * Get actions for a given connection action type and database session
     * @param type type of the connection action (e.g., "sql-editor", "datagrid-result")
     * @param session database session
     * @returns array of actions for the specified connection action type and database session
     */
    getConnectionActions(type: "sql-editor", session: IDatabaseSession): ConnectionActions<monaco.editor.ICodeEditor>[] | null;
    getConnectionActions(type: "sql-result", session: IDatabaseSession): ConnectionActions<DataGridActionContext<any>>[] | null;
    getConnectionActions<T extends object>(type: ConnectionActionType, session: IDatabaseSession): ConnectionActions<T>[] | null;

    getConnectionSqlResultTabs(session: IDatabaseSession): ConnectionSqlResultTab[] | null;

    /**
     * Get all registered plugins
     * @returns array of registered plugins
     */
    getPlugins(): RuntimePlugin[];
}

class PluginManager implements IPluginManager {
    private plugins: Map<string, RuntimePlugin> = new Map();
    pluginConnectionViewsFactories: ConnectionViewsFactory[] = []; // Array to hold connection view factories
    pluginConnectionActionsFactories: Map<ConnectionActionType, ConnectionActionsFactory<any>[]> = new Map(); // Map to hold connection action factories
    pluginConnectionSqlResultTabFactories: ConnectionSqlResultTabFactory[] = []; // Array to hold connection sql result tab factories

    constructor() {
    }

    registerPlugin(plugin: RuntimePlugin, internal: DatabaseInternalContext): void {
        if (this.plugins.has(plugin.manifest.id)) {
            return;
        }

        plugin.initialize({
            internal: internal,
            registerConnectionViewsFactory: (factory: ConnectionViewsFactory) => {
                this.pluginConnectionViewsFactories.push(factory);
            },
            registerConnectionActionsFactory: (type: ConnectionActionType, factory: ConnectionActionsFactory<any>) => {
                if (!this.pluginConnectionActionsFactories.has(type)) {
                    this.pluginConnectionActionsFactories.set(type, []);
                }
                this.pluginConnectionActionsFactories.get(type)!.push(factory);
            },
            registerConnectionSqlResultTabFactory: (factory: ConnectionSqlResultTabFactory) => {
                this.pluginConnectionSqlResultTabFactories.push(factory);
            },
        });

        this.plugins.set(plugin.manifest.id, plugin);
    }

    getConnectionViews(session: IDatabaseSession): ConnectionView[] | null {
        const views = this.pluginConnectionViewsFactories.map((factory) => factory(session)).flat().filter((view) => view !== null);
        return views;
    }

    getConnectionActions(type: ConnectionActionType, session: IDatabaseSession): ConnectionActions<any>[] | null {
        const factories = this.pluginConnectionActionsFactories.get(type) || [];
        const actions = factories.map((factory) => factory(session)).flat().filter((action) => action !== null);
        return actions;
    }

    getConnectionSqlResultTabs(session: IDatabaseSession): ConnectionSqlResultTab[] | null {
        const factories = this.pluginConnectionSqlResultTabFactories || [];
        const tabs = factories.map((factory) => factory(session)).flat().filter((tab) => tab !== null);
        return tabs;
    }

    getPlugins(): RuntimePlugin[] {
        return Array.from(this.plugins.values());
    }
}

export default PluginManager;