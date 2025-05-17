import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { View } from "@renderer/contexts/ApplicationContext";
import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";

export type PluginSessionViewsFunction = (session: IDatabaseSession) => View[] | null;

export interface IPluginContext {
    internal: DatabaseInternalContext; // Internal database context for executing queries and commands

    registerSessionViewsFactory: (factory: PluginSessionViewsFunction) => void; // Function to register session views
}
