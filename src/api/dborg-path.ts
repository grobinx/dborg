/* eslint-disable prettier/prettier */

/** User data home path */
export const DBORG_USER_DATA_PATH_NAME = 'dborgUserData'
/** Settings path */
export const DBORG_SETTINGS_PATH_NAME = 'dborgSettings'
/** Editors content path */
export const DBORG_EDITORS_PATH_NAME = 'dborgEditors'
/** Data path */
export const DBORG_DATA_PATH_NAME = 'dborgData'

export type DBORG_PATHS = 
    typeof DBORG_USER_DATA_PATH_NAME 
    | typeof DBORG_SETTINGS_PATH_NAME 
    | typeof DBORG_EDITORS_PATH_NAME
    | typeof DBORG_DATA_PATH_NAME
    | 'home' 
    | 'appData' 
    | 'userData' 
    | 'sessionData' 
    | 'temp' 
    | 'exe' 
    | 'module' 
    | 'desktop' 
    | 'documents' 
    | 'downloads' 
    | 'music' 
    | 'pictures' 
    | 'videos' 
    | 'recent' 
    | 'logs' 
    | 'crashDumps'
