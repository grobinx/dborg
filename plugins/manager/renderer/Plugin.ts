import { BaseContainer, BaseView, View } from "@renderer/contexts/ApplicationContext";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { ReactNode } from "react";

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
export interface CustomContainer extends BaseContainer {
    type: "custom";
}

/**
 * Interface representing a rendered view
 */
export interface RenderedView extends BaseView {
    type: "rendered"; // Type of the view
    render: () => React.ReactNode; // Panel component to be rendered for the view
}

export type ConnectionViewSlotType = "title" | "datagrid" | "text";

export interface IConnectionViewSlot {
    id: string; // Unique identifier for the slot
    type: ConnectionViewSlotType; // Type of the slot
}

export interface TitleConnectionViewSlot extends IConnectionViewSlot {
    type: "title"; // Type of the slot
    icon?: ReactNode; // Optional icon for the title
    title: string; // Title of the slot
    tKey?: string; // Translation key for the title
    actions?: ActionDescriptor<any>[]; // Array of actions to be performed on the slot
}

export interface DataGridConnectionViewSlot extends IConnectionViewSlot {
    type: "datagrid"; // Type of the slot
    sql: string; // SQL query to be executed
    columns: ColumnDefinition[]; // Array of column definitions for the data grid
    actions?: ActionDescriptor<any>[]; // Array of actions to be performed on the data grid
    onRowClick?: (row: any) => void; // Callback function for row click events
}

export interface TextConnectionViewSlot extends IConnectionViewSlot {
    type: "text"; // Type of the slot
    content: string | (() => string); // Content of the text slot
}

/**
 * Interface representing a connection view
 */
export interface ConnectionView extends BaseView {
    type: "connection"; // Type of the view
    slots: IConnectionViewSlot[]; // Array of slots in the view
}

/**
 * Interface representing a callback function for registering connection views
 * @param session The database session for which the views are being registered
 */
export type PluginConnectionViewsFunction = (session: IDatabaseSession) => View[] | null;

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
    registerConnectionViewsFactory: (factory: PluginConnectionViewsFunction) => void;
}
