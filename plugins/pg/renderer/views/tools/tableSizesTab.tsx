import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { cidFactory } from "@renderer/containers/ViewSlots/helpers";

interface RelationSizeRecord {
    schema_name: string;
    relname: string;
    relkind: string;
    total_size_bytes: number;
    total_size: string;
    table_size: string;
    index_size: string;
    toast_size: string;
    index_count?: number;
    n_live_tup?: number;
    avg_row_size_bytes?: number;
    avg_row_size?: string;
    last_analyze?: string | null;
    last_vacuum?: string | null;
    comment?: string | null;
    [key: string]: any;
}

const tableSizesTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = cidFactory("tools-table-sizes", session.info.uniqueId);

    let selectedSchemaName: string | null = null;
    const setSelectedSchemaName = async () => {
        try {
            const { rows } = await session.query<{ schema_name: string }>('select current_schema() as schema_name');
            selectedSchemaName = rows[0]?.schema_name ?? null;
        } catch (e) {
            selectedSchemaName = null;
        }
    };

    return {
        id: cid("tab"),
        type: "tab",
        onMount: (slotContext) => {
            setSelectedSchemaName().then(() => {
                slotContext.refresh(cid("grid"));
            });
        },
        label: {
            type: "tablabel",
            label: t("database-table-sizes", "Relation Sizes"),
            icon: "Storage",
        },
        content: {
            type: "tabcontent",
            content: () => ({
                id: cid("grid"),
                type: "grid",
                rows: async () => {
                    if (!selectedSchemaName) return [];

                    const params = [selectedSchemaName];
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
                            END AS toast_size,
                            (SELECT count(*) FROM pg_catalog.pg_index i WHERE i.indrelid = c.oid AND i.indisvalid) AS index_count,
                            COALESCE(st.n_live_tup, c.reltuples) AS n_live_tup,
                            CASE WHEN COALESCE(st.n_live_tup, c.reltuples) > 0 
                                THEN (pg_total_relation_size(c.oid)::numeric / GREATEST(COALESCE(st.n_live_tup, c.reltuples),1))
                                ELSE NULL
                            END AS avg_row_size_bytes,
                            -- pg_size_pretty requires integer input; cast the computed numeric size to bigint
                            pg_size_pretty(
                                CASE WHEN COALESCE(st.n_live_tup, c.reltuples) > 0 
                                    THEN ( (pg_total_relation_size(c.oid)::numeric / GREATEST(COALESCE(st.n_live_tup, c.reltuples),1))::bigint )
                                    ELSE 0::bigint
                                END
                            ) AS avg_row_size,
                            st.last_analyze,
                            st.last_vacuum,
                            pd.description AS comment
                        FROM pg_catalog.pg_class c
                        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                        LEFT JOIN pg_catalog.pg_stat_all_tables st ON st.schemaname = n.nspname AND st.relname = c.relname
                        LEFT JOIN pg_catalog.pg_description pd ON pd.objoid = c.oid AND pd.objsubid = 0
                        WHERE c.relkind IN ('r','m') -- tables, matviews
                          AND ( n.nspname = $1
                                OR (
                                    n.nspname = any (current_schemas(false))
                                    AND coalesce($1, current_schema()) = current_schema()
                                    AND n.nspname <> 'public'
                                )
                              )
                    `, params);
                    return rows;
                },
                columns: [
                    { key: "schema_name", label: t("schema", "Schema"), width: 140, dataType: "string" },
                    { key: "relname", label: t("relation", "Relation"), width: 240, dataType: "string" },
                    { key: "relkind", label: t("kind", "Kind"), width: 90, dataType: "string" },
                    { key: "total_size", label: t("total-size", "Total Size"), width: 120, dataType: "size", sortDirection: "desc", sortOrder: 1 },
                    { key: "table_size", label: t("table-size", "Table Size"), width: 120, dataType: "size" },
                    { key: "index_size", label: t("index-size", "Index Size"), width: 120, dataType: "size" },
                    { key: "toast_size", label: t("toast-size", "TOAST Size"), width: 120, dataType: "size" },
                    { key: "index_count", label: t("index-count", "Indexes"), width: 100, dataType: "number" },
                    { key: "n_live_tup", label: t("rows-est", "Rows (est.)"), width: 120, dataType: "number" },
                    { key: "avg_row_size", label: t("avg-row-size", "Avg Row Size"), width: 120, dataType: "size" },
                    { key: "last_analyze", label: t("last-analyze", "Last Analyze"), width: 160, dataType: "date" },
                    { key: "last_vacuum", label: t("last-vacuum", "Last Vacuum"), width: 160, dataType: "date" },
                    { key: "comment", label: t("comment", "Comment"), width: 240, dataType: "string" },
                ] as ColumnDefinition[],
                actions: [
                    SelectSchemaAction(),
                ],
                actionGroups: (slotContext) => [
                    SelectSchemaGroup(session, selectedSchemaName, (schemaName: string | null) => {
                        selectedSchemaName = schemaName;
                        slotContext.refresh(cid("grid"));
                    })
                ],
                autoSaveId: `database-table-sizes-grid-${session.profile.sch_id}`,
                statuses: ["data-rows"],
            } as IGridSlot),
        },
        toolBar: {
            id: cid("tab", "toolbar"),
            type: "toolbar",
            tools: () => [
                SelectSchemaAction_ID,
                SearchData_ID,
            ],
            actionSlotId: cid("grid"),
        },
    };
};

export default tableSizesTab;