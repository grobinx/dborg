import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, IDialogBooleanField, IDialogEditorField, IDialogRow, IDialogSlot, IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { cidFactory } from "@renderer/containers/ViewSlots/helpers";
import Decimal from "decimal.js";
import { PercentageCell } from "@renderer/components/DataGrid/PercentageCell";
import { versionToNumber } from "../../../../../src/api/version";

interface RelationMaintenanceRecord {
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
    bloat_bytes?: number;
    bloat_pct?: number;
    bloat_size?: string;
    bloat_status?: string;
    vacuum_phase?: string | null;
    heap_blks_total?: number | null;
    heap_blks_scanned?: number | null;
    heap_blks_vacuumed?: number | null;
    heap_scanned_pct?: number | null;
    heap_vacuumed_pct?: number | null;
    [key: string]: any;
}

const tableMaintenanceTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = cidFactory("tools-table-maintenance", session.info.uniqueId);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    let selectedSchemaName: string | null = null;
    let relationSizeRows: RelationMaintenanceRecord[] = [];
    let selectedTable: RelationMaintenanceRecord | null = null;

    let vacuumStructure: Record<string, any> = {
        full: false,
        analyze: true,
        freeze: false,
        disable_page_skipping: false,
        skip_locked: false,
        index_cleanup: true,
        truncate: true,
        parallel: 0,
        process_main: true,
        process_toast: false,
        buffer_usage_limit: 0,
        skip_database_stats: false,
        only_database_stats: false,
        sql: "-- no SQL preview available --",
    };

    const setSelectedSchemaName = async () => {
        try {
            const { rows } = await session.query<{ schema_name: string }>('select current_schema() as schema_name');
            selectedSchemaName = rows[0]?.schema_name ?? null;
        } catch (e) {
            selectedSchemaName = null;
        }
    };

    const vacuumSql = (structure: Record<string, any>) => {
        if (!selectedTable) return "-- no table selected --";
        const options = [
            structure.full && !structure.freeze && "FULL",
            structure.analyze && !structure.freeze && "ANALYZE",
            structure.freeze && "FREEZE",
            structure.disable_page_skipping && "DISABLE_PAGE_SKIPPING",
            (versionNumber >= 130000 && structure.skip_locked) && "SKIP_LOCKED",
            (versionNumber >= 130000 && structure.index_cleanup === false) && "INDEX_CLEANUP FALSE",
            (versionNumber >= 130000 && structure.truncate === false) && "TRUNCATE FALSE",
            (versionNumber >= 140000 && structure.parallel > 0 && structure.index_cleanup) ? `PARALLEL ${structure.parallel}` : null,
            (versionNumber >= 160000 && structure.process_main === false) && "PROCESS_MAIN FALSE",
            (versionNumber >= 160000 && structure.process_toast === true) && "PROCESS_TOAST TRUE",
            (versionNumber >= 160000 && structure.buffer_usage_limit > 0) && `BUFFER_USAGE_LIMIT '${structure.buffer_usage_limit}MB'`,
            (versionNumber >= 160000 && structure.skip_database_stats && !structure.only_database_stats) && "SKIP_DATABASE_STATS",
            (versionNumber >= 160000 && structure.only_database_stats && !structure.skip_database_stats) && "ONLY_DATABASE_STATS",
        ].filter(Boolean).join(", ");

        return `VACUUM ${options ? '(' + options + ')' : ''} ${selectedTable.schema_name}.${selectedTable.relname};`;
    }

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
            label: t("database-table-maintenance", "Relation Maintenance"),
            icon: "Storage",
        },
        content: (slotContext) => ({
            type: "tabcontent",
            content: () => ({
                id: cid("grid"),
                type: "grid",
                uniqueField: "relname",
                rows: async () => {
                    if (!selectedSchemaName) return [];

                    const params = [selectedSchemaName];
                    const { rows } = await session.query<RelationMaintenanceRecord>(`
                        WITH rec_widths AS (
                            SELECT 
                                c.oid,
                                COALESCE(SUM(CASE WHEN a.attlen > 0 THEN a.attlen ELSE 32 END), 100)::numeric AS estimated_avg_width
                            FROM pg_catalog.pg_class c
                            LEFT JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid 
                                AND a.attnum > 0 
                                AND NOT a.attisdropped
                            WHERE c.relkind IN ('r','m')
                            GROUP BY c.oid
                        )
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
                            COALESCE(st.n_live_tup, c.reltuples)::numeric AS n_live_tup,
                            CASE WHEN COALESCE(st.n_live_tup, c.reltuples) > 0 
                                THEN (pg_total_relation_size(c.oid)::numeric / GREATEST(COALESCE(st.n_live_tup, c.reltuples),1))
                                ELSE NULL
                            END AS avg_row_size_bytes,
                            pg_size_pretty(
                                CASE WHEN COALESCE(st.n_live_tup, c.reltuples) > 0 
                                    THEN ( (pg_total_relation_size(c.oid)::numeric / GREATEST(COALESCE(st.n_live_tup, c.reltuples),1))::bigint )
                                    ELSE 0::bigint
                                END
                            ) AS avg_row_size,
                            st.last_analyze,
                            st.last_vacuum,
                            pd.description AS comment,
                            p.phase AS vacuum_phase,
                            p.heap_blks_total,
                            p.heap_blks_scanned,
                            p.heap_blks_vacuumed,
                            CASE WHEN p.heap_blks_total > 0
                                THEN round(100.0 * p.heap_blks_scanned / p.heap_blks_total, 2)
                                ELSE NULL END AS heap_scanned_pct,
                            CASE WHEN p.heap_blks_total > 0
                                THEN round(100.0 * p.heap_blks_vacuumed / p.heap_blks_total, 2)
                                ELSE NULL END AS heap_vacuumed_pct,
                            CASE WHEN (SELECT count(*) FROM pg_catalog.pg_index i WHERE i.indrelid = c.oid AND i.indisvalid) > 0
                                THEN round(100.0 * p.index_vacuum_count / (SELECT count(*) FROM pg_catalog.pg_index i WHERE i.indrelid = c.oid AND i.indisvalid), 2)
                                ELSE NULL END AS index_vacuumed_pct,
                            CASE 
                              WHEN c.relpages > 0 THEN
                                ROUND(100.0 * GREATEST(0::numeric,
                                  (c.relpages::numeric - CEIL(COALESCE(st.n_live_tup, c.reltuples)::numeric *
                                    tm.estimated_avg_width
                                    / current_setting('block_size')::numeric
                                  ))
                                ) / NULLIF(c.relpages::numeric, 0), 2)
                              ELSE 0
                            END AS bloat_pct,
                            pg_size_pretty(
                              CASE 
                                WHEN c.relpages > 0 AND COALESCE(st.n_live_tup, c.reltuples) > 0 THEN
                                  GREATEST(0::bigint,
                                    (c.relpages - CEIL(COALESCE(st.n_live_tup, c.reltuples)::numeric *
                                      tm.estimated_avg_width
                                      / current_setting('block_size')::numeric
                                    )::bigint)
                                  ) * current_setting('block_size')::bigint
                                ELSE 0::bigint
                              END
                            ) AS bloat_size
                        FROM pg_catalog.pg_class c
                        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                        JOIN rec_widths tm ON tm.oid = c.oid
                        LEFT JOIN pg_catalog.pg_stat_all_tables st ON st.schemaname = n.nspname AND st.relname = c.relname
                        LEFT JOIN pg_catalog.pg_description pd ON pd.objoid = c.oid AND pd.objsubid = 0
                        LEFT JOIN pg_catalog.pg_stat_progress_vacuum p ON p.relid = c.oid
                        WHERE c.relkind IN ('r','m') -- tables, matviews
                          AND ( n.nspname = $1
                                OR (
                                    n.nspname = any (current_schemas(false))
                                    AND coalesce($1, current_schema()) = current_schema()
                                    AND n.nspname <> 'public'
                                )
                              )
                    `, params);
                    relationSizeRows = rows;
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
                    {
                        key: "vacuum_phase", label: t("vacuum-phase", "Vacuum Phase"), width: 140, dataType: "string",
                        formatter: (_value: any, row: RelationMaintenanceRecord) => {
                            let prc: number | null = null;
                            if (row.vacuum_phase === "scanning heap" && row.heap_scanned_pct) {
                                const l = new Decimal(row.heap_scanned_pct).toNumber();
                                prc = l * 0.3;
                            } else if (row.vacuum_phase === "vacuuming heap" && row.heap_vacuumed_pct) {
                                const l = new Decimal(row.heap_vacuumed_pct).toNumber();
                                prc = 30 + (l * 0.4);
                            } else if (row.vacuum_phase === "vacuuming indexes") {
                                prc = 70;
                            } else if (row.vacuum_phase === "cleaning up indexes") {
                                prc = 90;
                            } else if (row.vacuum_phase === "performing final cleanup") {
                                prc = 99;
                            }
                            return <PercentageCell value={prc} mode="primary" label={row.vacuum_phase ?? undefined} />
                        }
                    },
                    {
                        key: "bloat_pct", label: t("bloat-pct", "Bloat %"), width: 100, dataType: "number",
                        formatter: (value: any) => <PercentageCell value={value} mode="percentage" />
                    },
                    { key: "bloat_size", label: t("bloat-size", "Bloat Size"), width: 120, dataType: "size" },
                    { key: "comment", label: t("comment", "Comment"), width: 240, dataType: "string" },
                ] as ColumnDefinition[],
                onRowSelect: (row: RelationMaintenanceRecord | null) => {
                    selectedTable = row;
                    if (selectedTable) {
                        slotContext.refresh(cid("tab", "toolbar"));
                    }
                },
                actions: [
                    SelectSchemaAction(),
                    {
                        id: "vacuum-relation-action",
                        label: t("vacuum-relation", "Vacuum Relation"),
                        icon: "Vacuum",
                        disabled: () => selectedTable === null,
                        run: () => {
                            slotContext.openDialog(cid("vacuum-relation-dialog"), vacuumStructure).then(result => {
                                if (result) {
                                    vacuumStructure = result;
                                }
                            });
                        }
                    },
                    {
                        id: "analyze-relation-action",
                        label: t("analyze-relation", "Analyze Relation"),
                        icon: "Analyze",
                        disabled: () => selectedTable === null,
                        run: () => {

                        }
                    }
                ],
                actionGroups: (slotContext) => [
                    SelectSchemaGroup(session, selectedSchemaName, (schemaName: string | null) => {
                        selectedSchemaName = schemaName;
                        slotContext.refresh(cid("grid"));
                    })
                ],
                autoSaveId: `database-table-sizes-grid-${session.profile.sch_id}`,
                statuses: [
                    "data-rows",
                    {
                        label: () => {
                            const vacuuming = relationSizeRows.filter(r => !!r.vacuum_phase).length;
                            return `${t("vacuuming", "Vacuuming")}: ${vacuuming}`;
                        },
                    },
                ],
            } as IGridSlot),
            dialogs: [
                {
                    id: cid("vacuum-relation-dialog"),
                    type: "dialog",
                    title: () => t("vacuum-relation-dialog-title", "Vacuum Relation {{relation}}", { relation: selectedTable ? `${selectedTable.schema_name}.${selectedTable.relname}` : "" }),
                    height: "70%",
                    items: [
                        {
                            type: "tabs",
                            tabs: [
                                {
                                    id: "options",
                                    label: t("options", "Options"),
                                    items: [
                                        {
                                            type: "column",
                                            items: [
                                                {
                                                    type: "row",
                                                    items: [
                                                        {
                                                            type: "boolean",
                                                            key: "full",
                                                            label: t("vacuum-full", "Full Vacuum"),
                                                            helperText: t("vacuum-full-dialog-tooltip", "Reclaim disk space (slower, locks table)"),
                                                            disabled: (structure) => structure.freeze === true,
                                                        } as IDialogBooleanField,
                                                        {
                                                            type: "boolean",
                                                            key: "analyze",
                                                            label: t("vacuum-analyze", "Analyze"),
                                                            helperText: t("vacuum-analyze-dialog-tooltip", "Update table statistics after vacuum"),
                                                            disabled: (structure) => structure.freeze === true,
                                                        } as IDialogBooleanField,
                                                    ]
                                                } as IDialogRow,
                                                {
                                                    type: "boolean",
                                                    key: "freeze",
                                                    label: t("vacuum-freeze", "Freeze"),
                                                    helperText: t("vacuum-freeze-dialog-tooltip", "Freeze tuples (prevents transaction ID wraparound)"),
                                                } as IDialogBooleanField,
                                                ...(versionNumber >= 160000 ? [
                                                    {
                                                        type: "row",
                                                        items: [
                                                            {
                                                                type: "boolean",
                                                                key: "skip_database_stats",
                                                                label: t("vacuum-skip-database-stats", "Skip Database Stats"),
                                                                helperText: t("vacuum-skip-database-stats-tooltip", "Skip updating database-wide statistics"),
                                                                // mutually exclusive with ONLY_DATABASE_STATS
                                                                disabled: (s) => s.only_database_stats === true,
                                                            },
                                                            {
                                                                type: "boolean",
                                                                key: "only_database_stats",
                                                                label: t("vacuum-only-database-stats", "Only Database Stats"),
                                                                helperText: t("vacuum-only-database-stats-tooltip", "Only update database-wide statistics"),
                                                                // mutually exclusive with SKIP_DATABASE_STATS
                                                                disabled: (s) => s.skip_database_stats === true,
                                                            }
                                                        ]
                                                    }
                                                ] : []),
                                                {
                                                    type: "boolean",
                                                    key: "disable_page_skipping",
                                                    label: t("vacuum-disable-page-skipping", "Disable Page Skipping"),
                                                    helperText: t("vacuum-disable-page-skipping-tooltip", "Disable skipping of pages that are known to contain no dead tuples"),
                                                    // not applicable for VACUUM FULL
                                                    disabled: (s) => s.full === true,
                                                } as IDialogBooleanField,
                                                ...(versionNumber >= 130000 ? [
                                                    {
                                                        type: "boolean",
                                                        key: "skip_locked",
                                                        label: t("vacuum-skip-locked", "Skip Locked"),
                                                        helperText: t("vacuum-skip-locked-tooltip", "Skip pages that are locked by other transactions"),
                                                        // can't be used with VACUUM FULL; also conflicts with needing to process all pages (FREEZE)
                                                        disabled: (s) => s.full === true || s.freeze === true,
                                                    } as IDialogBooleanField,
                                                    {
                                                        type: "boolean",
                                                        key: "index_cleanup",
                                                        label: t("vacuum-index-cleanup", "Index Cleanup"),
                                                        helperText: t("vacuum-index-cleanup-tooltip", "Specifies whether to clean up indexes"),
                                                        // not applicable for VACUUM FULL
                                                        disabled: (s) => s.full === true,
                                                    },
                                                    {
                                                        type: "boolean",
                                                        key: "truncate",
                                                        label: t("vacuum-truncate", "Truncate"),
                                                        helperText: t("vacuum-truncate-tooltip", "Specifies whether to truncate empty pages at the end of the table"),
                                                        // not applicable for VACUUM FULL
                                                        disabled: (s) => s.full === true,
                                                    }
                                                ] : []),
                                                ...(versionNumber >= 140000 ? [
                                                    {
                                                        type: "number",
                                                        key: "parallel",
                                                        label: t("vacuum-parallel", "Parallel"),
                                                        helperText: t("vacuum-parallel-tooltip", "Use multiple worker processes to vacuum the table"),
                                                        min: 0,
                                                        max: 16,
                                                        // parallel vacuum is for lazy vacuum; also requires index cleanup enabled
                                                        disabled: (s) => s.full === true || s.index_cleanup === false,
                                                    },
                                                ] : []),
                                                ...(versionNumber >= 160000 ? [
                                                    {
                                                        type: "row",
                                                        items: [{
                                                            type: "boolean",
                                                            key: "process_main",
                                                            label: t("vacuum-process-main", "Process Main"),
                                                            helperText: t("vacuum-process-main-tooltip", "Vacuum the main table (default). Disable to vacuum only the TOAST table."),
                                                            // prevent both PROCESS_MAIN and PROCESS_TOAST being false
                                                            disabled: (s) => s.process_main === true && s.process_toast !== true,
                                                        } as IDialogBooleanField,
                                                        {
                                                            type: "boolean",
                                                            key: "process_toast",
                                                            label: t("vacuum-process-toast", "Process TOAST"),
                                                            helperText: t("vacuum-process-toast-tooltip", "Vacuum the TOAST table. Disable to vacuum only the main table (default)."),
                                                            // prevent both PROCESS_MAIN and PROCESS_TOAST being false
                                                            disabled: (s) => s.process_toast === true && s.process_main !== true,
                                                        } as IDialogBooleanField,
                                                        ]
                                                    } as IDialogRow,
                                                    {
                                                        type: "number",
                                                        key: "buffer_usage_limit",
                                                        label: t("vacuum-buffer-usage-limit", "Buffer Usage Limit (MB)"),
                                                        helperText: t("vacuum-buffer-usage-limit-tooltip", "Sets the maximum number of shared buffers that can be used by the VACUUM operation"),
                                                        // treat as not applicable for VACUUM FULL
                                                        disabled: (s) => s.full === true,
                                                    }
                                                ] : []),
                                            ],
                                        }
                                    ]
                                },
                                {
                                    id: "editor",
                                    label: t("sql", "SQL"),
                                    items: [
                                        {
                                            type: "editor",
                                            key: "sql",
                                            height: "100%",
                                            width: "100%",
                                        } as IDialogEditorField
                                    ],
                                }
                            ]
                        },
                    ],
                    confirmLabel: () => t("vacuum", "Vacuum"),
                    onOpen: (structure) => {
                        structure.sql = vacuumSql(structure);
                    },
                    onConfirm: async (values: Record<string, any>) => {
                        if (!selectedTable) return;

                        try {
                            await session.query(values.sql);
                            slotContext.showNotification({
                                message: t("vacuum-success", "Vacuum completed successfully"),
                                severity: "success",
                            });
                            slotContext.refresh(cid("grid"));
                        } catch (error: any) {
                            slotContext.showNotification({
                                message: t("vacuum-error-message", "Vacuum failed {{error}}", { error: error.message }),
                                severity: "error",
                            });
                        }
                    },
                    onChange(values) {
                        values.sql = vacuumSql(values);
                    },
                } as IDialogSlot,
            ],
        }),
        toolBar: {
            id: cid("tab", "toolbar"),
            type: "toolbar",
            tools: () => [
                [
                    "vacuum-relation-action",
                    "analyze-relation-action",
                ],
                SelectSchemaAction_ID,
                SearchData_ID,
                {
                    onTick: async (slotContext) => {
                        slotContext.refresh(cid("grid"));
                    },
                    canPause: false,
                    intervals: [5, 10, 15, 30, 60],
                    defaultInterval: 10,
                    canRefresh: true,
                } as IAutoRefresh,
            ],
            actionSlotId: cid("grid"),
        },
    };
};

export default tableMaintenanceTab;