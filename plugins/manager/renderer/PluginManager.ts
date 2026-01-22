import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { Plugin, ConnectionViewsFactory, ConnectionView } from "./Plugin";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";

export interface IPluginManager {
    /**
     * Get session views for a given database session
     * @param session database session
     */
    getConnectionViews(session: IDatabaseSession): ConnectionView[] | null;
    /**
     * Get all registered plugins
     * @returns array of registered plugins
     */
    getPlugins(): Plugin[];
}

class PluginManager implements IPluginManager {
    private plugins: Map<string, Plugin> = new Map();
    pluginConnectionViewsFactories: ConnectionViewsFactory[] = []; // Array to hold connection view factories

    constructor() {
    }

    registerPlugin(plugin: Plugin, internal: DatabaseInternalContext): void {
        if (this.plugins.has(plugin.id)) {
            return;
        }

        plugin.initialize({
            internal: internal,
            registerConnectionViewsFactory: (factory: ConnectionViewsFactory) => {
                this.registerConnectionViewFactory(factory);
            },
        });

        this.plugins.set(plugin.id, plugin);
    }

    registerConnectionViewFactory(factory: ConnectionViewsFactory): void {
        this.pluginConnectionViewsFactories.push(factory);
    }

    getConnectionViews(session: IDatabaseSession): ConnectionView[] | null {
        const views = this.pluginConnectionViewsFactories.map((factory) => factory(session)).flat().filter((view) => view !== null);
        return views;
    }

    getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }
}

export default PluginManager;