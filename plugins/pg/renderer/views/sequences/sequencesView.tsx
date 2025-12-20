import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { IGridSlot } from "plugins/manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { sequenceCommentDdl, sequenceDdl, sequenceOperationalDdl, sequenceOwnerDdl, sequencePrivilegesDdl } from "../../../common/ddls/sequence";

export interface SequenceRecord {
    sequence_schema: string;
    sequence_name: string;
    data_type: string | null;
    start_value: number | null;
    min_value: number | null;
    max_value: number | null;
    increment_by: number | null;
    cycle: boolean | null;
    cache_size: number | null;
    last_value: number | null;
    owner_table: string | null;
    owner_column: string | null;
    owner: string | null;
    comment: string | null;
    [key: string]: any;
}

export function sequencesView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    let selectedSchemaName: string | null = null;
    let selectedRow: SequenceRecord | null = null;

    const setSelectedSchemaName = async () => {
        const { rows } = await session.query<{ schema_name: string }>('select current_schema() as schema_name');
        selectedSchemaName = rows[0]?.schema_name ?? null;
    };
    setSelectedSchemaName();

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        type: "connection",
        id: cid("sequences-view"),
        icon: "Sequence",
        label: t("database-sequences", "Sequences"),
        slot: {
            id: cid("sequences-slot"),
            type: "integrated",
            editors: [
                {
                    id: cid("sequences-editors-tab"),
                    type: "tab",
                    closable: false,
                    label: {
                        id: cid("sequences-tab-label"),
                        type: "tablabel",
                        label: t("database-sequences", "Sequences"),
                        icon: "Sequence",
                    },
                    content: {
                        id: cid("sequences-tab-content"),
                        type: "tabcontent",
                        content: () => ({
                            id: cid("sequences-splitter"),
                            type: "split",
                            direction: "vertical",
                            first: () => ({
                                id: cid("sequences-grid"),
                                type: "grid",
                                mode: "defined",
                                uniqueField: "sequence_name",
                                onMount: (refresh: any) => {
                                    refresh(cid("sequences-toolbar"));
                                },
                                rows: async () => {
                                    const ver = session.getVersion() ?? "";
                                    const major = parseInt(String(ver).match(/\d+/)?.[0] ?? "0", 10);

                                    const sql10plus = `
select
  s.schemaname as sequence_schema,
  s.sequencename as sequence_name,
  format_type(seq.seqtypid, null) as data_type,
  s.start_value,
  s.min_value,
  s.max_value,
  s.increment_by,
  s.cycle,
  s.cache_size,
  s.last_value,
  -- owner table/column (via pg_depend)
   (
     select format('%I.%I', tn.nspname, tc.relname)
     from pg_depend d
     join pg_class tc on tc.oid = d.refobjid
     join pg_namespace tn on tn.oid = tc.relnamespace
     where d.objid = c.oid and d.deptype in ('a','i')
     limit 1
   ) as owner_table,
   (
     select a.attname
     from pg_depend d
     join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
     where d.objid = c.oid and d.deptype in ('a','i')
     limit 1
   ) as owner_column,
  -- sequence owner role and comment
  rol.rolname as owner,
  pd.description as comment
from pg_sequences s
join pg_class c on c.relname = s.sequencename and c.relkind = 'S'
join pg_namespace n on n.nspname = s.schemaname and n.oid = c.relnamespace
join pg_sequence seq on seq.seqrelid = c.oid
left join pg_roles rol on rol.oid = c.relowner
left join pg_description pd on pd.objoid = c.oid and pd.classoid = 'pg_class'::regclass and pd.objsubid = 0
where (s.schemaname = $1 or (s.schemaname = any (current_schemas(false)) and coalesce($1, current_schema()) = current_schema() and s.schemaname <> 'public'))
order by sequence_schema, sequence_name;
`;

                                    const sqlLegacy = `
select
   n.nspname as sequence_schema,
   c.relname as sequence_name,
   null::text as data_type,
   null::bigint as start_value,
   null::bigint as min_value,
   null::bigint as max_value,
   null::bigint as increment_by,
   null::boolean as cycle,
   null::bigint as cache_size,
   null::bigint as last_value,
   (
     select format('%I.%I', tn.nspname, tc.relname)
     from pg_depend d
     join pg_class tc on tc.oid = d.refobjid
     join pg_namespace tn on tn.oid = tc.relnamespace
     where d.objid = c.oid and d.deptype = 'a'
     limit 1
   ) as owner_table,
   (
     select a.attname
     from pg_depend d
     join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
     where d.objid = c.oid and d.deptype = 'a'
     limit 1
   ) as owner_column,
   rol.rolname as owner,
   pd.description as comment
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_roles rol on rol.oid = c.relowner
left join pg_description pd on pd.objoid = c.oid and pd.classoid = 'pg_class'::regclass and pd.objsubid = 0
where c.relkind = 'S'
   and (n.nspname = $1 or (n.nspname = any (current_schemas(false)) and coalesce($1, current_schema()) = current_schema() and n.nspname <> 'public'))
order by sequence_schema, sequence_name;
`;

                                    const sql = major >= 10 ? sql10plus : sqlLegacy;

                                    const { rows } = await session.query<SequenceRecord>(sql, [selectedSchemaName]);
                                    return rows;
                                },
                                columns: [
                                    { key: "sequence_name", label: t("sequence-name", "Sequence Name"), dataType: "string", width: 220 },
                                    { key: "sequence_schema", label: t("schema-name", "Schema Name"), dataType: "string", width: 150 },
                                    { key: "owner", label: t("owner", "Owner"), dataType: "string", width: 160 },
                                    { key: "data_type", label: t("data-type", "Data Type"), dataType: "string", width: 120 },
                                    { key: "last_value", label: t("last-value", "Last Value"), dataType: "number", width: 130 },
                                    { key: "start_value", label: t("start-value", "Start"), dataType: "number", width: 110 },
                                    { key: "min_value", label: t("min-value", "Min"), dataType: "number", width: 110 },
                                    { key: "max_value", label: t("max-value", "Max"), dataType: "number", width: 130 },
                                    { key: "increment_by", label: t("increment-by", "Increment"), dataType: "number", width: 120 },
                                    { key: "cache_size", label: t("cache-size", "Cache"), dataType: "number", width: 100 },
                                    { key: "cycle", label: t("cycle", "Cycle"), dataType: "boolean", width: 90 },
                                    { key: "owner_table", label: t("owner-table", "Owner Table"), dataType: "string", width: 220 },
                                    { key: "owner_column", label: t("owner-column", "Owner Column"), dataType: "string", width: 180 },
                                    { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                                ] as ColumnDefinition[],
                                onRowSelect: (row: SequenceRecord | undefined, refresh: RefreshSlotFunction) => {
                                    selectedRow = row ?? null;
                                    if (selectedRow) {
                                        refresh(cid("sequences-editor"));
                                    }
                                },
                                actions: [
                                    SelectSchemaAction(),
                                ],
                                actionGroups: (refresh: RefreshSlotFunction) => [
                                    SelectSchemaGroup(session, selectedSchemaName, (schemaName: string) => {
                                        selectedSchemaName = schemaName;
                                        refresh(cid("sequences-grid"));
                                    }),
                                ],
                                autoSaveId: `sequences-grid-${session.profile.sch_id}`,
                                status: ["data-rows"]
                            } as IGridSlot),
                            second: {
                                id: cid("sequences-editor"),
                                type: "editor",
                                lineNumbers: false,
                                readOnly: true,
                                miniMap: false,
                                content: async () => {
                                    if (selectedRow) {
                                        let ddl = "";
                                        const { rows } = await session.query(sequenceDdl(session.getVersion()!), [selectedRow.sequence_schema, selectedRow.sequence_name]);
                                        if (rows.length > 0) {
                                            ddl += rows[0].source;
                                        }
                                        const { rows: ownerRows } = await session.query(sequenceOwnerDdl(session.getVersion()!), [selectedRow.sequence_schema, selectedRow.sequence_name]);
                                        if (ownerRows.length > 0) {
                                            ddl += "\n\n" + ownerRows[0].source;
                                        }
                                        const { rows: privilegesRows } = await session.query(sequencePrivilegesDdl(session.getVersion()!), [selectedRow.sequence_schema, selectedRow.sequence_name]);
                                        if (privilegesRows.length > 0) {
                                            ddl += "\n\n" + privilegesRows[0].source;
                                        }
                                        const { rows: operationalRows } = await session.query(sequenceOperationalDdl(session.getVersion()!), [selectedRow.sequence_schema, selectedRow.sequence_name]);
                                        if (operationalRows.length > 0) {
                                            ddl += "\n\n" + operationalRows[0].source;
                                        }
                                        const { rows: commentRows } = await session.query(sequenceCommentDdl(session.getVersion()!), [selectedRow.sequence_schema, selectedRow.sequence_name]);
                                        if (commentRows.length > 0) {
                                            ddl += "\n\n" + commentRows[0].source;
                                        }
                                        return ddl;
                                    } else {
                                        return "-- No sequence selected";
                                    }
                                },
                            }
                        }),
                    },
                    toolBar: {
                        id: cid("sequences-toolbar"),
                        type: "toolbar",
                        tools: [
                            SelectSchemaAction_ID
                        ],
                        actionSlotId: cid("sequences-grid"),
                    }
                },
            ]
        }
    };
}