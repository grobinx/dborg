import { DatabasesMetadata } from "src/api/db";
import { ProfileRecord } from "../../../../api/entities";

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

export const TAB_PANEL_VALUE = "tab-panel-value";
export interface TabPanelValueMessage {
    itemID: string;
    name: string;
    value: any;
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
 * Edit the db profile.
 * @param profileId The db profile.
 */
export const EDIT_PROFILE = "edit-profile";

/**
 * Clone the db profile and edit as new one.
 * @param profileId The db profile to clone.
 */
export const CLONE_EDIT_PROFILE = "clone-edit-profile";

/**
 * Set the profile ID for the current operation.
 * @param profileId The ID of the profile to set.
 */
export const SET_PROFILE_ID = "set-profile-id";

/**
 * Set the profile ID for clone profile to edit as new one.
 * @param profileId The ID of the profile to set.
 */
export const SET_CLONE_PROFILE_ID = "set-clone-profile-id";

/**
 * End the edit of the db profile
 */
export const END_EDIT_PROFILE = "end-edit-profile";

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
    profile: ProfileRecord; // Name of the profile to get metadata for
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
