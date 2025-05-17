import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { Plugin } from "./Plugin";
import { PluginSessionViewsFunction } from "./PluginContext";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { View } from "@renderer/contexts/ApplicationContext";

export interface IPluginManager {
    /**
     * Get session views for a given database session
     * @param session database session
     */
    getSessionViews(session: IDatabaseSession): View[] | null;
    /**
     * Get all registered plugins
     * @returns array of registered plugins
     */
    getPlugins(): Plugin[];
}

class PluginManager implements IPluginManager {
    private plugins: Map<string, Plugin> = new Map();
    pluginSessionViewsFactories: PluginSessionViewsFunction[] = []; // Array to hold session view factories

    constructor() {
    }

    registerPlugin(plugin: Plugin, internal: DatabaseInternalContext): void {
        if (this.plugins.has(plugin.id)) {
            return;
        }

        plugin.initialize({
            internal: internal,
            registerSessionViewsFactory: (factory: PluginSessionViewsFunction) => {
                this.registerSessionViewFactory(factory);
            },
        });

        this.plugins.set(plugin.id, plugin);
    }

    registerSessionViewFactory(factory: PluginSessionViewsFunction): void {
        this.pluginSessionViewsFactories.push(factory);
    }

    getSessionViews(session: IDatabaseSession): View[] | null {
        const views = this.pluginSessionViewsFactories.map((factory) => factory(session)).flat().filter((view) => view !== null);
        return views;
    }

    getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }
}

export default PluginManager;