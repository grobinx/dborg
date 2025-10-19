import { DatabasesMetadata } from "src/api/db";
import { SchemaRecord } from "../../contexts/SchemaContext";

/**
 * Toggle the visibility of the tools panel.
 */
export const TOGGLE_TOOLS_TABS_PANEL = "toggle-tools-tabs-panel";

/**
 * Switch to a specific tab in the tools panel.
 * @param tabsItemID The ID of the tabs panel that changed.
 * @param itemID The name of the tab to switch to.
 */
export const SWITCH_PANEL_TAB = "switch-panel-tab";

/**
 * Changed the tab panel.
 * @param tabsItemID The ID of the tabs panel that changed.
 * @param itemID The ID of the tab panel that changed.
 */
export const TAB_PANEL_CHANGED = "tab-panel-changed";
export interface TabPanelChangedMessage {
    tabsItemID: string;
    itemID: string;
}

/**
 * Moved the tab panel.
 * @param tabsItemID The ID of the tabs panel that was moved.
 * @param itemID The ID of the tab panel that was moved.
 * @param oldIndex The old index of the tab panel before being moved.
 * @param newIndex The new index of the tab panel after being moved.
 */
export const TAB_PANEL_MOVED = "tab-panel-moved";
export interface TabPanelMovedMessage {
    tabsItemID: string;
    itemID: string;
    oldIndex: number;
    newIndex: number;
}

/**
 * Click event for the tab panel.
 * @param tabsItemID The ID of the tabs panel that was clicked.
 * @param itemID The ID of the tab panel that was clicked.
 */
export const TAB_PANEL_CLICK = "tab-panel-click";
export interface TabPanelClickMessage {
    tabsItemID: string;
    itemID: string;
}

export const TAB_PANEL_LENGTH = "tab-panel-length";
export interface TabPanelLengthMessage {
    tabsItemID: string;
    length: number;
}

/**
 * Switch to a specific container
 * @param containerName The name of the container to switch to.
 */
export const SWITCH_CONTAINER = "switch-container";

/**
 * Switch to a specific view in the container.
 * @param viewId The ID of the view to switch to.
 */
export const SWITCH_VIEW = "switch-view";

/**
 * Edit the db schema
 * @param schemaId The db schema.
 */
export const EDIT_SCHEMA = "edit-schema";

/**
 * Clone the db schema and edit as new one.
 * @param schemaId The db schema to clone.
 */
export const CLONE_EDIT_SCHEMA = "clone-edit-schema";

/**
 * Set the schema ID for the current operation.
 * @param schemaId The ID of the schema to set.
 */
export const SET_SCHEMA_ID = "set-schema-id";

/**
 * Set the schema ID for clone schema to edit as new one.
 * @param schemaId The ID of the schema to set.
 */
export const STE_CLONE_SCHEMA_ID = "set-clone-schema-id";

/**
 * End the edit of the db schema
 */
export const END_EDIT_SCHEMA = "end-edit-schema";

/**
 * Logo click event.
 */
export const SIDE_BAR_BUTTON_TOGGLE_EXPAND = "side-bar-button-toggle-expand";

/**
 * Change the side bar placement.
 * @param placement The new placement of the side bar.
 */
export const CHANGE_SIDE_BAR_PLACEMENT = "change-side-bar-placement";

export const SESSION_GET_METADATA_START = "session:get-metadata:start";
export type SessionGetMetadataStart = {
    connectionId: string; // Unique identifier for the connection
    schema: SchemaRecord; // Name of the schema to get metadata for
}
export const SESSION_GET_METADATA_PROGRESS = "session:get-metadata";
export type SessionGetMetadataProgress = {
    connectionId: string; // Unique identifier for the connection
    progress: string; // Progress of the metadata retrieval
}
export const SESSION_GET_METADATA_END = "session:get-metadata:end";
export type SessionGetMetadataEnd = {
    connectionId: string; // Unique identifier for the connection
}
export const SESSION_GET_METADATA_ERROR = "session:get-metadata:error";
export type SessionGetMetadataError = {
    connectionId: string; // Unique identifier for the connection
    error: string; // Error message
}
export const SESSION_GET_METADATA_SUCCESS = "session:get-metadata:success";
export type SessionGetMetadataSuccess = {
    connectionId: string; // Unique identifier for the connection
    metadata: DatabasesMetadata; // Metadata retrieved from the database
}
export const REFRESH_METADATA = "refresh-metadata";
export type RefreshMetadata = {
    connectionId: string; // Unique identifier for the connection
}
