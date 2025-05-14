/* eslint-disable prettier/prettier */

export const DBORG_DATA_PATH_NAME = 'dborgData'
export const DBORG_SETTINGS_PATH_NAME = 'dborgSettings'
export const DBORG_EDITORS_PATH_NAME = 'dborgEditors'
export type DBORG_PATHS = 
    typeof DBORG_DATA_PATH_NAME 
    | typeof DBORG_SETTINGS_PATH_NAME 
    | typeof DBORG_EDITORS_PATH_NAME
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
