import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { Plugin, ConnectionViewsFactory, ConnectionView, ConnectionActionsFactory, ConnectionActionType, ConnectionActions } from "./Plugin";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import * as monaco from "monaco-editor";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";

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

    /**
     * Get all registered plugins
     * @returns array of registered plugins
     */
    getPlugins(): Plugin[];
}

class PluginManager implements IPluginManager {
    private plugins: Map<string, Plugin> = new Map();
    pluginConnectionViewsFactories: ConnectionViewsFactory[] = []; // Array to hold connection view factories
    pluginConnectionActionsFactories: Map<ConnectionActionType, ConnectionActionsFactory<any>[]> = new Map(); // Map to hold connection action factories

    constructor() {
    }

    registerPlugin(plugin: Plugin, internal: DatabaseInternalContext): void {
        if (this.plugins.has(plugin.id)) {
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
        });

        this.plugins.set(plugin.id, plugin);
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

    getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }
}

export default PluginManager;