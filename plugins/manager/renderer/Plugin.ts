import { IContainer, IView } from "@renderer/contexts/ApplicationContext";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { IContentSlot } from "./CustomSlots";
import { ConnectionViewSlotKind } from "./ConnectionSlots";

/**
 * Interface representing a future feature or functionality of a plugin.
 */
export interface Future {
    /**
     * Name of the future feature or functionality.
     */
    name: string;
    /**
     * Description of the future feature or functionality.
     */
    description: string | URL;
}

/**
 * Interface representing a plugin in the DBorg application.
 */
export interface Plugin {
    /**
     * Unique identifier for the plugin.
     */
    id: string;
    /**
     * Name of the plugin.
     */
    name: string;
    /**
     * Description of the plugin.
     */
    description: string;
    /**
     * Optional details about the plugin.
     */
    details?: string | URL;
    /**
     * List of futures provided by the plugin.
     */
    futures?: Future[] | URL;
    /**
     * Version of the plugin.
     */
    version: string;
    /**
     * Categories the plugin belongs to.
     */
    categories?: string[];
    /**
     * Icon for the plugin.
     */
    icon: string | URL;
    /**
     * Author of the plugin.
     */
    author: string;
    /**
     * License type of the plugin.
     */
    licenseType: string;
    /**
     * Text of the license or URL to the license.
     */
    license?: string | URL;
    /**
     * Keywords associated with the plugin.
     */
    keywords?: string[];
    /**
     * Optional homepage URL of the plugin.
     */
    homepage?: URL; // Homepage URL of the plugin
    /**
     * Optional repository URL of the plugin.
     */
    repository?: URL;
    /**
     * Initializes the plugin with the given context.
     * 
     * @param context The plugin manager context to initialize with.
     */
    initialize(context: IPluginContext): void;
}

/**
 * Interface representing a custom container in the DBorg application.
 */
export interface CustomContainer extends IContainer {
    type: "custom";
}

/**
 * Interface representing a rendered view
 */
export interface RenderedView extends IView {
    type: "rendered"; // Type of the view
    render: () => React.ReactNode; // Panel component to be rendered for the view
}

/**
 * Interface representing a connection view
 */
export interface ConnectionView extends IView {
    type: "connection"; // Type of the view
    slot: ConnectionViewSlotKind;
}

/**
 * Interface representing a custom view
 */
export interface CustomView extends IView {
    type: "custom"; // Type of the view
    slot: IContentSlot;
}

/**
 * Interface representing a callback function for registering connection views
 * @param session The database session for which the views are being registered
 */
export type ConnectionViewsFactory = (session: IDatabaseSession) => ConnectionView[] | null;

/**
 * Interface representing the context in which a plugin operates
 * @property internal The internal database context for executing queries and commands
 */
export interface IPluginContext {
    /**
     * Internal database context for executing queries and commands
     */
    internal: DatabaseInternalContext;

    /**
     * Register a factory function for creating connection views.
     * @param factory Function to register connection views
     * @returns 
     */
    registerConnectionViewsFactory: (factory: ConnectionViewsFactory) => void;
}
