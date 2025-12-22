import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

interface SettingRecord {
    name: string;
    setting: string;
    unit: string | null;
    category: string;
    short_desc: string;
    context: string;
    vartype: string;
    source?: string;
    min_val?: string | null;
    max_val?: string | null;
    enumvals?: string[] | null;
    boot_val?: string;
    reset_val?: string;
    [key: string]: any;
}

const databaseSettingsTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    
    const major = parseInt((session.getVersion() ?? "0").split(".")[0], 10);
    const minor = parseInt((session.getVersion() ?? "0").split(".")[1], 10);
    const versionNumber = major * 10000 + minor * 100;

    return {
        id: cid("database-settings-tab"),
        type: "tab",
        label: {
            id: cid("database-settings-tab-label"),
            type: "tablabel",
            label: t("settings", "Settings"),
            icon: "Settings",
        },
        content: {
            id: cid("database-settings-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("database-settings-grid"),
                type: "grid",
                rows: async () => {
                    // Kolumny zależne od wersji
                    const sourceCol = versionNumber >= 90100 ? "source," : "null::text as source,";
                    const minMaxCols = versionNumber >= 90200 
                        ? "min_val, max_val, boot_val, reset_val," 
                        : "null::text as min_val, null::text as max_val, null::text as boot_val, null::text as reset_val,";

                    const { rows } = await session.query<SettingRecord>(
                        `
                        SELECT
                            name,
                            setting,
                            unit,
                            category,
                            short_desc,
                            context,
                            vartype,
                            ${sourceCol}
                            ${minMaxCols}
                            enumvals
                        FROM pg_catalog.pg_settings
                        ORDER BY category, name
                        `
                    );
                    return rows;
                },
                columns: [
                    { key: "name", label: t("name", "Name"), width: 250, dataType: "string" },
                    { key: "setting", label: t("setting", "Setting"), width: 150, dataType: "string" },
                    { key: "unit", label: t("unit", "Unit"), width: 100, dataType: "string" },
                    { key: "category", label: t("category", "Category"), width: 180, dataType: "string" },
                    { key: "context", label: t("context", "Context"), width: 140, dataType: "string" },
                    { key: "vartype", label: t("type", "Type"), width: 100, dataType: "string" },
                    ...(versionNumber >= 90100 ? [
                        { key: "source", label: t("source", "Source"), width: 140, dataType: "string" },
                    ] : []),
                    { key: "short_desc", label: t("description", "Description"), width: 400, dataType: "string" },
                    ...(versionNumber >= 90200 ? [
                        { key: "boot_val", label: t("boot-value", "Boot Value"), width: 150, dataType: "string" },
                        { key: "reset_val", label: t("reset-value", "Reset Value"), width: 150, dataType: "string" },
                        { key: "min_val", label: t("min-value", "Min Value"), width: 120, dataType: "string" },
                        { key: "max_val", label: t("max-value", "Max Value"), width: 120, dataType: "string" },
                    ] : []),
                ] as ColumnDefinition[],
                autoSaveId: `database-settings-grid-${session.profile.sch_id}`,
                status: ["data-rows"],
            } as IGridSlot),
        },
    };
};

export default databaseSettingsTab;