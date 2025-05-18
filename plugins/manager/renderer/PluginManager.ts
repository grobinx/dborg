import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { Plugin, PluginConnectionViewsFunction } from "./Plugin";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { View } from "@renderer/contexts/ApplicationContext";

export interface IPluginManager {
    /**
     * Get session views for a given database session
     * @param session database session
     */
    getConnectionViews(session: IDatabaseSession): View[] | null;
    /**
     * Get all registered plugins
     * @returns array of registered plugins
     */
    getPlugins(): Plugin[];
}

class PluginManager implements IPluginManager {
    private plugins: Map<string, Plugin> = new Map();
    pluginConnectionViewsFactories: PluginConnectionViewsFunction[] = []; // Array to hold connection view factories

    constructor() {
    }

    registerPlugin(plugin: Plugin, internal: DatabaseInternalContext): void {
        if (this.plugins.has(plugin.id)) {
            return;
        }

        plugin.initialize({
            internal: internal,
            registerConnectionViewsFactory: (factory: PluginConnectionViewsFunction) => {
                this.registerConnectionViewFactory(factory);
            },
        });

        this.plugins.set(plugin.id, plugin);
    }

    registerConnectionViewFactory(factory: PluginConnectionViewsFunction): void {
        this.pluginConnectionViewsFactories.push(factory);
    }

    getConnectionViews(session: IDatabaseSession): View[] | null {
        const views = this.pluginConnectionViewsFactories.map((factory) => factory(session)).flat().filter((view) => view !== null);
        return views;
    }

    getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }
}

export default PluginManager;