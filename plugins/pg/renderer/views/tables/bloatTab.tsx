import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { defaultVacuumStructure, vacuumDialog } from "../dialogs/vacuum-dialog";
import { versionToNumber } from "../../../../../src/api/version";

const bloatTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");
    let vacuumStructure = { ...defaultVacuumStructure };

    return {
        id: cid("table-bloat-tab"),
        type: "tab",
        label: {
            id: cid("table-bloat-tab-label"),
            type: "tablabel",
            label: t("bloat", "Bloat"),
        },
        content: (slotContext) => ({
            id: cid("table-bloat-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-bloat-grid"),
                type: "grid",
                pivot: true,
                rows: async () => {
                    if (!selectedRow()) return [];
                    const { rows } = await session.query(
                        `
                        select
                            s.schemaname as schema_name,
                            s.relname as table_name,
                            pg_total_relation_size(quote_ident(s.schemaname)||'.'||quote_ident(s.relname)) as total_bytes,
                            pg_size_pretty(pg_total_relation_size(quote_ident(s.schemaname)||'.'||quote_ident(s.relname))) as total_size,
                            s.n_live_tup,
                            s.n_dead_tup,
                            round(100.0 * s.n_dead_tup / nullif(s.n_live_tup + s.n_dead_tup, 0), 2) as dead_tup_pct,
                            s.last_vacuum,
                            s.last_autovacuum,
                            (50 + 0.2 * s.n_live_tup)::bigint as autovacuum_threshold,
                            case 
                              when c.relpages > 0 and s.n_live_tup > 0 then
                                greatest(0, 
                                  (c.relpages - ceil(s.n_live_tup::numeric * 
                                    coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
                                    / current_setting('block_size')::numeric
                                  )::bigint
                                ) * current_setting('block_size')::bigint)
                              else 0
                            end as bloat_bytes,
                            case 
                              when c.relpages > 0 then
                                round(100.0 * greatest(0, 
                                  (c.relpages - ceil(s.n_live_tup::numeric * 
                                    coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
                                    / current_setting('block_size')::numeric
                                  )::bigint
                                )) / nullif(c.relpages, 0), 2)
                              else 0
                            end as bloat_pct,
                            pg_size_pretty(
                              case 
                                when c.relpages > 0 and s.n_live_tup > 0 then
                                  greatest(0, 
                                    (c.relpages - ceil(s.n_live_tup::numeric * 
                                      coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
                                      / current_setting('block_size')::numeric
                                    )::bigint
                                  ) * current_setting('block_size')::bigint)
                                else 0
                              end
                            ) as bloat_size,
                            case 
                              when s.n_dead_tup > (50 + 0.2 * s.n_live_tup) * 0.5 and s.n_dead_tup > 100 then 'vacuum recommended'
                              when s.n_dead_tup > (50 + 0.2 * s.n_live_tup) and s.n_dead_tup > 1000 then 'vacuum critical'
                              when s.n_dead_tup::float / nullif(s.n_live_tup + s.n_dead_tup, 0) > 0.25 then 'high bloat'
                              when c.relpages > 0 and 
                                  100.0 * greatest(0, 
                                    (c.relpages - ceil(s.n_live_tup::numeric * 
                                      coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
                                      / current_setting('block_size')::numeric
                                    )::bigint
                                  )) / nullif(c.relpages, 0) > 30 then 'high bloat (pages)'
                              else 'ok'
                            end as bloat_status
                        from pg_stat_all_tables s
                        join pg_class c on c.oid = (quote_ident(s.schemaname)||'.'||quote_ident(s.relname))::regclass
                        where s.schemaname = $1 and s.relname = $2;
                        `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "schema_name", label: t("schema", "Schema"), dataType: "string", width: 150 },
                    { key: "table_name", label: t("table", "Table"), dataType: "string", width: 200 },
                    { key: "total_bytes", label: t("total-bytes", "Total Bytes"), dataType: "bigint", width: 130 },
                    { key: "total_size", label: t("total-size", "Total Size"), dataType: "size", width: 120 },
                    { key: "n_live_tup", label: t("live-tuples", "Live Tuples"), dataType: "bigint", width: 130 },
                    { key: "n_dead_tup", label: t("dead-tuples", "Dead Tuples"), dataType: "bigint", width: 130 },
                    { key: "dead_tup_pct", label: t("dead-pct", "Dead %"), dataType: "bigint", width: 100 },
                    { key: "last_vacuum", label: t("last-vacuum", "Last Vacuum"), dataType: "datetime", width: 180 },
                    { key: "last_autovacuum", label: t("last-autovacuum", "Last Autovacuum"), dataType: "datetime", width: 180 },
                    { key: "autovacuum_threshold", label: t("autovacuum-threshold", "Autovacuum Threshold"), dataType: "number", width: 180 },
                    { key: "bloat_bytes", label: t("bloat-bytes", "Bloat (bytes)"), dataType: "bigint", width: 130 },
                    { key: "bloat_pct", label: t("bloat-pct", "Bloat %"), dataType: "number", width: 100 },
                    { key: "bloat_size", label: t("bloat-size", "Bloat Size"), dataType: "size", width: 120 },
                    { key: "bloat_status", label: t("status", "Status"), dataType: "string", width: 180 },
                ] as ColumnDefinition[],
                actions: [
                    {
                        id: "vacuum-relation-action",
                        label: t("vacuum-relation", "Vacuum Relation"),
                        icon: "Vacuum",
                        disabled: () => selectedRow() === null,
                        run: () => {
                            slotContext.openDialog(cid("vacuum-relation-dialog"), vacuumStructure).then(result => {
                                if (result) {
                                    vacuumStructure = result;
                                }
                            });
                        }
                    },
                ],
                autoSaveId: `table-bloat-grid-${session.profile.sch_id}`,
            } as IGridSlot),
            dialogs: [
                vacuumDialog(
                    versionNumber,
                    cid("vacuum-relation-dialog"),
                    () => selectedRow() ? selectedRow()!.identifier : null,
                    async (values: Record<string, any>) => {
                        if (!selectedRow()) return;

                        const identifier = selectedRow()!.identifier;
                        session.enqueue({
                            execute: async (s) => {
                                await s.execute(values.sql);
                                slotContext.showNotification({
                                    message: t("vacuum-relation-success", "Vacuum {{relation}} completed successfully", { relation: identifier }),
                                    severity: "success",
                                });
                                slotContext.refresh(cid("table-bloat-grid"));
                            },
                            label: `Vacuum ${identifier}`,
                        });
                    },
                ),
            ],
        }),
        toolBar: {
            id: cid("table-bloat-toolbar"),
            type: "toolbar",
            tools: [
                "vacuum-relation-action"
            ],
            actionSlotId: cid("table-bloat-grid"),
        },
    };
}

export default bloatTab;