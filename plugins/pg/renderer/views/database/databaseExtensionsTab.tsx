import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

interface ExtensionRecord {
    extname: string;
    extversion: string;
    schema_name: string;
    relocatable: boolean;
    [key: string]: any;
}

const databaseExtensionsTab = (session: IDatabaseSession, _database: string | null): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("database-extensions-tab"),
        type: "tab",
        label: {
            id: cid("database-extensions-tab-label"),
            type: "tablabel",
            label: t("extensions", "Extensions"),
            icon: "Extensions",
        },
        content: {
            id: cid("database-extensions-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("database-extensions-grid"),
                type: "grid",
                rows: async () => {
                    const { rows } = await session.query<ExtensionRecord>(`
                        SELECT 
                            e.extname,
                            e.extversion,
                            n.nspname AS schema_name,
                            e.extrelocatable AS relocatable
                        FROM pg_catalog.pg_extension e
                        JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
                        ORDER BY e.extname
                    `);
                    return rows;
                },
                columns: [
                    { key: "extname", label: t("name", "Name"), width: 200, dataType: "string" },
                    { key: "extversion", label: t("version", "Version"), width: 120, dataType: "string" },
                    { key: "schema_name", label: t("schema", "Schema"), width: 160, dataType: "string" },
                    { key: "relocatable", label: t("relocatable", "Relocatable"), width: 110, dataType: "boolean" },
                ] as ColumnDefinition[],
                autoSaveId: `database-extensions-grid-${session.profile.sch_id}`,
                status: ["data-rows"],
            } as IGridSlot),
        },
    };
};

export default databaseExtensionsTab;