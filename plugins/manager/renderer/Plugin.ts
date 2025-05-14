import { PluginContext } from "./PluginContext";

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
    initialize(context: PluginContext): void; 
}