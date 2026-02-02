import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, IDialogBooleanField, IDialogEditorField, IDialogNumberField, IDialogRow, IDialogSlot, IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { cidFactory } from "@renderer/containers/ViewSlots/helpers";
import Decimal from "decimal.js";
import { PercentageCell } from "@renderer/components/DataGrid/PercentageCell";
import { versionToNumber } from "../../../../../src/api/version";
import { defaultVacuumStructure, vacuumDialog } from "../dialogs/vacuum-dialog";
import sleep from "@renderer/utils/sleep";

interface RelationMaintenanceRecord {
    schema_name: string;
    relname: string;
    identifier: string;
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

    let vacuumStructure = { ...defaultVacuumStructure };

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
                            format('%I.%I', n.nspname, c.relname) AS identifier,
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
                vacuumDialog(
                    versionNumber,
                    cid("vacuum-relation-dialog"),
                    () => selectedTable ? selectedTable.identifier : null,
                    async (values: Record<string, any>) => {
                        if (!selectedTable) return;

                        const identifier = selectedTable.identifier;
                        session.enqueue({
                            execute: async (s) => {
                                try {
                                    await s.execute(values.sql);
                                    slotContext.showNotification({
                                        message: t("vacuum-relation-success", "Vacuum {{relation}} completed successfully", { relation: identifier }),
                                        severity: "success",
                                    });
                                    slotContext.refresh(cid("grid"));
                                } catch (error: any) {
                                    slotContext.showNotification({
                                        message: t("vacuum-relation-error-message", "Vacuum {{relation}} failed {{error}}", { relation: identifier, error: error.message }),
                                        severity: "error",
                                    });
                                }
                            },
                            label: `Vacuum ${identifier}`,
                        });
                    },
                ),
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