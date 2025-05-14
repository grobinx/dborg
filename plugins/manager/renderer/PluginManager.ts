import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { Plugin } from "./Plugin";
import { PluginSessionViews } from "./PluginContext";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { View } from "@renderer/contexts/ApplicationContext";

export interface PluginManagerBase {
    /**
     * Get session views for a given database session
     * @param session database session
     */
    getSessionViews(session: IDatabaseSession): View[] | null;
    /**
     * Get all registered plugins
     * @returns array of registered plugins
     */
    getPlugin(): Plugin[];
}

class PluginManager implements PluginManagerBase {
    private plugins: Map<string, Plugin> = new Map();
    pluginSessionViewsFactories: PluginSessionViews[] = []; // Array to hold session view factories

    constructor() {
    }

    registerPlugin(plugin: Plugin, internal: DatabaseInternalContext): void {
        if (this.plugins.has(plugin.id)) {
            return;
        }

        plugin.initialize({
            internal: internal,
            registerSessionViewsFactory: (factory: PluginSessionViews) => {
                this.registerSessionViewFactory(factory);
            },
        });

        this.plugins.set(plugin.id, plugin);
    }

    registerSessionViewFactory(factory: PluginSessionViews): void {
        this.pluginSessionViewsFactories.push(factory);
    }

    getSessionViews(session: IDatabaseSession): View[] | null {
        const views = this.pluginSessionViewsFactories.map((factory) => factory(session)).flat().filter((view) => view !== null);
        return views;
    }

    getPlugin(): Plugin[] {
        return Array.from(this.plugins.values());
    }
}

export default PluginManager;