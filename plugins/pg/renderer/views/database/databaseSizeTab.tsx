import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

interface RelationSizeRecord {
    schema_name: string;
    relname: string;
    relkind: string;
    total_size_bytes: number;
    total_size: string;
    table_size: string;
    index_size: string;
    toast_size: string;
    [key: string]: any;
}

const databaseSizeTab = (session: IDatabaseSession, _database: string | null): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("database-size-tab"),
        type: "tab",
        label: {
            id: cid("database-size-tab-label"),
            type: "tablabel",
            label: t("database-size", "Size & Objects"),
            icon: "Storage",
        },
        content: {
            id: cid("database-size-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("database-size-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    const { rows } = await session.query<RelationSizeRecord>(`
                        SELECT
                            n.nspname AS schema_name,
                            c.relname,
                            case 
                                when c.relkind = 'r' then 'table'
                                when c.relkind = 'm' then 'materialized view'
                                else c.relkind::varchar
                            end AS relkind,
                            pg_total_relation_size(c.oid) AS total_size_bytes,
                            pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
                            pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
                            pg_size_pretty(pg_indexes_size(c.oid)) AS index_size,
                            CASE 
                                WHEN c.reltoastrelid <> 0 
                                    THEN pg_catalog.pg_size_pretty(pg_total_relation_size(c.reltoastrelid))
                                ELSE pg_catalog.pg_size_pretty(0::bigint)
                            END AS toast_size
                        FROM pg_catalog.pg_class c
                        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                        WHERE c.relkind IN ('r','m') -- tables, matviews
                          AND n.nspname NOT IN ('pg_catalog','information_schema')
                          AND c.relname NOT LIKE 'pg_%'
                        ORDER BY pg_total_relation_size(c.oid) DESC
                        LIMIT 200
                    `);
                    return rows;
                },
                columns: [
                    { key: "schema_name", label: t("schema", "Schema"), width: 140, dataType: "string" },
                    { key: "relname", label: t("relation", "Relation"), width: 240, dataType: "string" },
                    { key: "relkind", label: t("kind", "Kind"), width: 90, dataType: "string" },
                    { key: "total_size", label: t("total-size", "Total Size"), width: 120, dataType: "size" },
                    { key: "table_size", label: t("table-size", "Table Size"), width: 120, dataType: "size" },
                    { key: "index_size", label: t("index-size", "Index Size"), width: 120, dataType: "size" },
                    { key: "toast_size", label: t("toast-size", "TOAST Size"), width: 120, dataType: "size" },
                ] as ColumnDefinition[],
                autoSaveId: `database-size-grid-${session.profile.sch_id}`,
                status: ["data-rows"],
            } as IGridSlot),
        },
    };
};

export default databaseSizeTab;