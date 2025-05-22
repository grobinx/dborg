import { BaseContainer, BaseView, View } from "@renderer/contexts/ApplicationContext";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { ColumnDefinition, DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { ReactNode } from "react";
import { ContentSlot, TabsSlot } from "./CustomSlots";

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

export type ConnectionViewSlotType = 
"title" 
| "datagrid" 
| "text" 
| "rendered" 
| "integrated" 
| "tabs"
| "tab" 
| "root";

/**
 * Interface representing a connection view slot
 */
export interface IConnectionViewSlot {
    /**
     * Unique identifier for the slot.
     */
    id: string;
    /**
     * Type of the slot
     */
    type: ConnectionViewSlotType;
}

/**
 * Interface representing a title connection view slot
 */
export interface TitleConnectionViewSlot extends IConnectionViewSlot {
    /**
     * Type of the slot.
     * This slot is used to display a title in the connection view.
     */
    type: "title";
    /**
     * Optional icon for the title.
     */
    icon?: ReactNode;
    /**
     * Title of the slot
     */
    title: string | (() => string);
    /**
     * Array of action IDs to be performed on the title, defined in DataGrid and/or DataGridConnectionViewSlot
     * These actions will be displayed as buttons in the title bar.
     */
    actions?: string[];
}

/**
 * Interface representing a connection view slot for a data grid
 */
export interface DataGridConnectionViewSlot extends IConnectionViewSlot {
    /**
     * Type of the slot
     */
    type: "datagrid";
    /**
     * SQL query to be executed to fetch data for the data grid
     * This query will be executed in the context of the current database session.
     */
    sql: string;
    /**
     * Optional parameters for the SQL query
     * This can be an array of parameters or a function that returns an array of parameters.
     */
    parameters?: any[] | ((context: DataGridActionContext<any> | undefined) => any[]);
    /**
     * Array of column definitions for the data grid
     */
    columns: ColumnDefinition[];
    /**
     * Array of actions to be performed on the data grid
     */
    actions?: ActionDescriptor<any>[];
    /**
     * Array of action groups to be performed on the data grid
     */
    actionGroups?: ActionGroupDescriptor<any>[];
    /**
     * Callback function for row click events
     * @param row The clicked row data
     */
    onRowClick?: (row: any) => void;
}

/**
 * Interface representing a connection view slot for displaying text, eg a description of object on clicked row
 * This slot is used to display static or dynamic text content in the connection view.
 */
export interface TextConnectionViewSlot extends IConnectionViewSlot {
    /**
     * Type of the slot
     */
    type: "text";
    /**
     * Content of the text slot
     */
    content: string | (() => string);
}

/**
 * Interface representing a connection view
 */
export interface ConnectionView extends BaseView {
    type: "connection"; // Type of the view
    slots: IConnectionViewSlot[]; // Array of slots in the view
}

export interface CustomConnectionView extends BaseView {
    type: "custom"; // Type of the view
    slot: CustomIntegratedSlot | CustomRootSlot;
}

export interface CustomRootSlot extends IConnectionViewSlot {
    type: "root";
    root: ContentSlot;
}

export interface CustomIntegratedSlot extends IConnectionViewSlot {
    type: "integrated";
    side?: ContentSlot;
    editor?: TabsSlot;
    result?: TabsSlot;
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
