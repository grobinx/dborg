import { Properties } from "src/api/db";

export type ProfileUsePasswordType = "ask" | "save" | "empty" | undefined;

// Define the profile structure
export interface ProfileRecord {
    sch_id: string;
    sch_created?: string;
    sch_updated?: string;
    sch_deleted?: boolean;
    sch_drv_unique_id: string;
    sch_group?: string;
    sch_pattern?: string;
    sch_name: string;
    sch_color?: string;
    sch_use_password?: ProfileUsePasswordType;
    sch_properties: Properties;
    sch_last_selected?: string;
    sch_db_version?: string;
    sch_script?: string;
    sch_order?: number;
    [key: string]: any;
}

// Define the driver structure
export interface DriverRecord {
    drv_id: string;
    drv_unique_id: string;
    drv_name: string;
    drv_description: string;
    drv_icon: string;
    drv_version: string;
    [key: string]: any;
}

export interface DborgRecord {
    id: string;
    version : string;
    lastVersion : string | null;
    firstStart : string;
    lastStart : string;
    release : string;
    author : string;
    homepage : string;
    license : string;
    date : string;
    duration : string;
    platform: string;
    arch: string;
    environment: {
        node: string;
        v8: string;
        uv: string;
        zlib: string;
        openssl: string;
        electron: string;
    };
    [key: string]: any;
}

export interface QueryHistoryRecord {
    qh_id: string;
    qh_created: string; // ISO 8601
    qh_updated: string; // ISO 8601
    qh_profile_name: string;
    qh_query: string;
    qh_hash: string;
    qh_start_time: string; // ISO 8601
    qh_execution_time: number | null;
    qh_fetch_time: number | null;
    qh_rows: number | null;
    qh_error: string | null;
    [key: string]: any;
}
