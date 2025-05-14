import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { View } from "@renderer/contexts/ApplicationContext";
import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";

export type PluginSessionViews = (session: IDatabaseSession) => View[] | null;

export interface PluginContext {
    internal: DatabaseInternalContext; // Internal database context for executing queries and commands

    registerSessionViewsFactory: (factory: PluginSessionViews) => void; // Function to register session views
}
