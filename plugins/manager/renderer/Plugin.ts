import { IContainer, IView } from "@renderer/contexts/ApplicationContext";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { DatabaseInternalContext } from "@renderer/contexts/DatabaseContext";
import { IContentSlot } from "./CustomSlots";
import { ConnectionActionsFactory, ConnectionSqlResultTabFactory, ConnectionViewSlotKind } from "./ConnectionSlots";
import * as monaco from "monaco-editor";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { RichNode } from "@renderer/components/RichContent";

/**
 * Type representing a valid HTTP or HTTPS URL for plugin-related content.
 */
export type PluginHttpUrl = `${"http" | "https"}://${string}`;

export type PluginTextType = { type: "text"; value: string };
export type PluginUrlType = { type: "url"; href: PluginHttpUrl };
export type PluginRichType = { type: "rich"; content: RichNode };
export type PluginMarkdownType = { type: "markdown"; text: string };
export type PluginFileType = { type: "file"; path: string };
export type PluginAssetType = { type: "asset"; path: string };
export type PluginRawType = { type: "raw"; raw: string; contentType: string };

export function isPluginContentString(content: any): content is string {
    return typeof content === "string";
}
export function isPluginContentText(content: any): content is PluginTextType {
    return typeof content === "object" && content.type === "text";
}
export function isPluginContentUrl(content: any): content is PluginUrlType {
    return typeof content === "object" && content.type === "url";
}
export function isPluginContentRich(content: any): content is PluginRichType {
    return typeof content === "object" && content.type === "rich";
}
export function isPluginContentMarkdown(content: any): content is PluginMarkdownType {
    return typeof content === "object" && content.type === "markdown";
}
export function isPluginContentFile(content: any): content is PluginFileType {
    return typeof content === "object" && content.type === "file";
}
export function isPluginIconAsset(icon: any): icon is PluginAssetType {
    return typeof icon === "object" && icon.type === "asset";
}
export function isPluginIconUrl(icon: any): icon is PluginUrlType {
    return typeof icon === "object" && icon.type === "url";
}
export function isPluginIconRaw(icon: any): icon is PluginRawType {
    return typeof icon === "object" && icon.type === "raw";
}

/**
 * Type representing the content of a plugin, which can be a string, text, URL, markdown, or file path.
 */
export type PluginContent =
    | string
    | PluginTextType
    /* URL content */
    | PluginUrlType
    /** Rich subsystem content node */
    | PluginRichType
    /** Markdown content */
    | PluginMarkdownType
    /** File path content */
    | PluginFileType

/**
 * Icon reference for a plugin, which can be an asset path, URL, or raw content with a specified content type.
 */
export type PluginIconRef =
    /* Asset path content */
    | PluginAssetType
    /* URL content */
    | PluginUrlType
    /* Raw content with specified content type */
    | PluginRawType; // e.g., SVG content with "image/svg+xml" content type;

/**
 * Interface representing a future feature or functionality of a plugin.
 */
export interface PluginManifestFeature {
    /**
     * Name of the future feature or functionality.
     */
    name: string;
    /**
     * Description of the future feature or functionality.
     */
    description: PluginContent;
}

/**
 * Interface representing the manifest of a plugin, containing metadata and information about the plugin.
 */
export interface PluginManifest {
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
    description: PluginContent;
    /**
     * Optional details about the plugin.
     */
    details?: PluginContent;
    /**
     * List of futures provided by the plugin.
     */
    futures?: PluginManifestFeature[];
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
    icon: PluginIconRef;
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
    license?: PluginContent;
    /**
     * Keywords associated with the plugin.
     */
    keywords?: string[];
    /**
     * Optional homepage URL of the plugin.
     */
    homepage?: PluginHttpUrl;
    /**
     * Optional repository URL of the plugin.
     */
    repository?: PluginHttpUrl;
}

/**
 * Interface representing a plugin in the DBorg application.
 */
export interface RuntimePlugin {
    /**
     * Manifest containing metadata and information about the plugin.
     */
    manifest: PluginManifest;
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
 * Interface representing a clickable button only
 */
export interface ClickableView extends IView {
    type: "clickable"; // Type of the view
    onClick: () => void; // Callback function to be executed when the view is clicked
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

    /**
     * Register a factory function for creating connection actions
     * @overload
     * @param type - Type of action ("editor" or "datagrid")
     * @param factory - Factory function for creating actions
     */
    registerConnectionActionsFactory(type: "sql-editor", factory: ConnectionActionsFactory<monaco.editor.ICodeEditor>): void;
    registerConnectionActionsFactory(type: "sql-result", factory: ConnectionActionsFactory<DataGridActionContext<any>>): void;
    registerConnectionActionsFactory(type: string, factory: ConnectionActionsFactory<any>): void;

    /**
     * Register a factory function for creating connection SQL result tabs.
     * @param factory Factory function for creating SQL result tabs
     * @returns 
     */
    registerConnectionSqlResultTabFactory: (factory: ConnectionSqlResultTabFactory) => void;
}
