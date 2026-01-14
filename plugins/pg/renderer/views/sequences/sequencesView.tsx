import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { IGridSlot } from "plugins/manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/ViewSlotContext";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { sequenceCommentDdl, sequenceDdl, sequenceOperationalDdl, sequenceOwnerDdl, sequencePrivilegesDdl } from "../../../common/ddls/sequence";
import { versionToNumber } from "../../../../../src/api/version";

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
    owner: string | null;
    comment: string | null;
    [key: string]: any;
}

// Struktura wynikowa dla zaznaczonego zapytania (details)
// Zwraca seq.* + dep.owner_table/owner_table_schema/owner_column
export interface SequenceAclEntry {
    grantor: string | null;
    grantee: string | null;
    privilege_type: string | null;
    is_grantable: boolean | null;
}

export interface SequenceDetailsRecord {
    oid: number;
    sequence_schema: string;
    sequence_name: string;
    owner: string | null;
    data_type: string | null;
    start_value: number | null;
    min_value: number | null;
    max_value: number | null;
    increment_by: number | null;
    cycle: boolean | null;
    cache_size: number | null;
    last_value: number | null;
    comment: string | null;
    acl: SequenceAclEntry[]; // json_agg(row_to_json(a)) -> lista wpisów ACL
    owner_table: string | null;
    owner_table_schema: string | null;
    owner_column: string | null;
    [key: string]: any;
}

export function sequencesView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    let selectedSchemaName: string | null = null;
    let selectedRow: SequenceRecord | null = null;
    let selectedRowDetails: SequenceDetailsRecord | null = null;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

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
                        content: {
                            id: cid("sequences-details-splitter"),
                            type: "split",
                            direction: "horizontal",
                            autoSaveId: `sequences-details-splitter-${session.profile.sch_id}`,
                            secondSize: 25,
                            first: {
                                id: cid("sequences-editor-splitter"),
                                type: "split",
                                direction: "vertical",
                                autoSaveId: `sequences-editor-splitter-${session.profile.sch_id}`,
                                secondSize: 25,
                                first: {
                                    id: cid("sequences-grid"),
                                    type: "grid",
                                    uniqueField: "sequence_name",
                                    rows: async () => {
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
  -- owner table/column removed
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
   -- owner table/column removed
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

                                        const sql = versionNumber >= 100000 ? sql10plus : sqlLegacy;

                                        const { rows } = await session.query<SequenceRecord>(sql, [selectedSchemaName]);
                                        return rows;
                                    },
                                    columns: [
                                        { key: "sequence_name", label: t("sequence-name", "Sequence Name"), dataType: "string", width: 220 },
                                        { key: "sequence_schema", label: t("schema-name", "Schema Name"), dataType: "string", width: 150 },
                                        { key: "owner", label: t("owner", "Owner"), dataType: "string", width: 160 },
                                        ...(versionNumber >= 100000 ? [
                                            { key: "data_type", label: t("data-type", "Data Type"), dataType: "string", width: 120 },
                                            { key: "last_value", label: t("last-value", "Last Value"), dataType: "number", width: 130 },
                                            { key: "start_value", label: t("start-value", "Start"), dataType: "number", width: 110 },
                                            { key: "min_value", label: t("min-value", "Min"), dataType: "number", width: 110 },
                                            { key: "max_value", label: t("max-value", "Max"), dataType: "number", width: 130 },
                                            { key: "increment_by", label: t("increment-by", "Increment"), dataType: "number", width: 120 },
                                            { key: "cache_size", label: t("cache-size", "Cache"), dataType: "number", width: 100 },
                                            { key: "cycle", label: t("cycle", "Cycle"), dataType: "boolean", width: 90 },
                                        ] : []),
                                        { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                                    ] as ColumnDefinition[],
                                    onRowSelect: (row: SequenceRecord | undefined, slotContext) => {
                                        if (selectedRow?.sequence_name !== row?.sequence_name || selectedRow?.sequence_schema !== row?.sequence_schema) {
                                            selectedRow = row ?? null;
                                            slotContext.refresh(cid("sequences-editor"));
                                            slotContext.refresh(cid("sequences-details-grid"));
                                        }
                                    },
                                    actions: [
                                        SelectSchemaAction(),
                                    ],
                                    actionGroups: (slotContext) => [
                                        SelectSchemaGroup(session, selectedSchemaName, (schemaName: string) => {
                                            selectedSchemaName = schemaName;
                                            slotContext.refresh(cid("sequences-grid"));
                                        }),
                                    ],
                                    autoSaveId: `sequences-grid-${session.profile.sch_id}`,
                                    statuses: ["data-rows"]
                                } as IGridSlot,
                                second: {
                                    id: cid("sequences-editor"),
                                    type: "editor",
                                    lineNumbers: false,
                                    readOnly: true,
                                    miniMap: false,
                                    content: async () => {
                                        if (!selectedRow) return "-- No sequence selected";
                                        return [
                                            await session.query<{ source: string }>(sequenceDdl(versionNumber), [selectedRow.sequence_schema, selectedRow.sequence_name]).then(res => res.rows.map(row => row.source).join("\n")),
                                            await session.query<{ source: string }>(sequenceOwnerDdl(versionNumber), [selectedRow.sequence_schema, selectedRow.sequence_name]).then(res => res.rows.map(row => row.source).join("\n")),
                                            await session.query<{ source: string }>(sequencePrivilegesDdl(versionNumber), [selectedRow.sequence_schema, selectedRow.sequence_name]).then(res => res.rows.map(row => row.source).join("\n")),
                                            await session.query<{ source: string }>(sequenceOperationalDdl(versionNumber), [selectedRow.sequence_schema, selectedRow.sequence_name]).then(res => res.rows.map(row => row.source).join("\n")),
                                            await session.query<{ source: string }>(sequenceCommentDdl(versionNumber), [selectedRow.sequence_schema, selectedRow.sequence_name]).then(res => res.rows.map(row => row.source).join("\n")),
                                        ].filter(Boolean).join("\n\n") ?? "-- No DDL available";
                                    },
                                },
                            },
                            second: {
                                id: cid("sequences-details-splitter"),
                                type: "split",
                                direction: "vertical",
                                autoSaveId: `sequences-details-splitter-${session.profile.sch_id}`,
                                first: {
                                    id: cid("sequences-details-grid"),
                                    type: "grid",
                                    pivot: true,
                                    rows: async (slotContext) => {
                                        if (!selectedRow) return [];

                                        let sql: string;

                                        if (versionNumber >= 100000) {
                                            sql = `
            with seq as (
                select c.oid, n.nspname as sequence_schema, c.relname as sequence_name,
                       rol.rolname as owner,
                       format_type(seq.seqtypid, null) as data_type,
                       s.start_value, s.min_value, s.max_value, s.increment_by, s.cycle, s.cache_size, s.last_value,
                       pd.description as comment,
                       coalesce(
                         (
                           select json_agg(row_to_json(a))
                           from (
                             select
                              pg_get_userbyid(grantor)  as grantor,
                              pg_get_userbyid(grantee)  as grantee,
                              privilege_type,
                              is_grantable
                            from aclexplode(c.relacl)
                           ) a
                         ),
                         '[]'::json
                       ) as acl
                from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                left join pg_roles rol on rol.oid = c.relowner
                left join pg_description pd on pd.objoid = c.oid and pd.classoid = 'pg_class'::regclass and pd.objsubid = 0
                left join pg_sequences s on s.schemaname = n.nspname and s.sequencename = c.relname
                left join pg_sequence seq on seq.seqrelid = c.oid
                where c.relname = $1 and n.nspname = $2 and c.relkind = 'S'
            ),
            dep as (
                select
                    d.objid,
                    cls.relname as owner_table,
                    ns.nspname as owner_table_schema,
                    att.attname as owner_column
                from pg_depend d
                join pg_class cls on cls.oid = d.refobjid
                join pg_namespace ns on ns.oid = cls.relnamespace
                left join pg_attribute att on att.attrelid = cls.oid and att.attnum = d.refobjsubid and att.attnum > 0
                where d.classid = 'pg_class'::regclass
                  and d.deptype = 'a'
                  and cls.relkind in ('r','p','t')
            )
            select
                seq.*,
                dep.owner_table,
                dep.owner_table_schema,
                dep.owner_column
            from seq
            left join dep on dep.objid = seq.oid
            limit 1
        `;
                                        } else {
                                            sql = `
            with seq as (
                select c.oid, n.nspname as sequence_schema, c.relname as sequence_name,
                    rol.rolname as owner,
                    seq_data.data_type,
                    seq_data.start_value,
                    seq_data.min_value,
                    seq_data.max_value,
                    seq_data.increment_by,
                    seq_data.is_cycled as cycle,
                    seq_data.cache_value as cache_size,
                    seq_data.last_value,
                    pd.description as comment,
                       coalesce(
                         (
                           select json_agg(row_to_json(a))
                           from (
                             select
                              pg_get_userbyid(grantor)  as grantor,
                              pg_get_userbyid(grantee)  as grantee,
                              privilege_type,
                              is_grantable
                            from aclexplode(c.relacl)
                           ) a
                         ),
                         '[]'::json
                       ) as acl
                from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                left join pg_roles rol on rol.oid = c.relowner
                left join pg_description pd on pd.objoid = c.oid and pd.classoid = 'pg_class'::regclass and pd.objsubid = 0
                -- pobierz wartości sekwencji przez select * from schemat.sekwencja
                left join lateral (
                    select 
                        null::text as data_type,
                        s.* 
                    from "${selectedRow?.sequence_schema}"."${selectedRow?.sequence_name}" s
                ) as seq_data on true
                where c.relname = $1 and n.nspname = $2 and c.relkind = 'S'
            ),
            dep as (
                select
                    d.objid,
                    cls.relname as owner_table,
                    ns.nspname as owner_table_schema,
                    att.attname as owner_column
                from pg_depend d
                join pg_class cls on cls.oid = d.refobjid
                join pg_namespace ns on ns.oid = cls.relnamespace
                left join pg_attribute att on att.attrelid = cls.oid and att.attnum = d.refobjsubid and att.attnum > 0
                where d.classid = 'pg_class'::regclass
                  and d.deptype = 'a'
                  and cls.relkind in ('r','p','t')
            )
            select
                seq.*,
                dep.owner_table,
                dep.owner_table_schema,
                dep.owner_column
            from seq
            left join dep on dep.objid = seq.oid
            limit 1
        `;
                                        }
                                        selectedRowDetails = null;

                                        const { rows } = await session.query<SequenceDetailsRecord>(sql, [selectedRow.sequence_name, selectedRow.sequence_schema]);
                                        if (!rows.length) return [];

                                        selectedRowDetails = rows[0];
                                        slotContext.refresh(cid("sequences-details-acl-grid"));

                                        // Zamiana na listę klucz-wartość do pivot grida
                                        return rows;
                                    },
                                    columns: [
                                        { key: "sequence_schema", label: t("schema-name", "Schema Name"), dataType: "string", width: 150 },
                                        { key: "sequence_name", label: t("sequence-name", "Sequence Name"), dataType: "string", width: 220 },
                                        { key: "owner", label: t("owner", "Owner"), dataType: "string", width: 160 },
                                        { key: "data_type", label: t("data-type", "Data Type"), dataType: "string", width: 120 },
                                        { key: "start_value", label: t("start-value", "Start Value"), dataType: "number", width: 110 },
                                        { key: "min_value", label: t("min-value", "Min Value"), dataType: "number", width: 110 },
                                        { key: "max_value", label: t("max-value", "Max Value"), dataType: "number", width: 130 },
                                        { key: "increment_by", label: t("increment-by", "Increment"), dataType: "number", width: 120 },
                                        { key: "cycle", label: t("cycle", "Cycle"), dataType: "boolean", width: 90 },
                                        { key: "cache_size", label: t("cache-size", "Cache Size"), dataType: "number", width: 100 },
                                        { key: "last_value", label: t("last-value", "Last Value"), dataType: "number", width: 130 },
                                        { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                                        { key: "owner_table", label: t("owner-table", "Owner Table"), dataType: "string", width: 220 },
                                        { key: "owner_table_schema", label: t("owner-table-schema", "Owner Table Schema"), dataType: "string", width: 150 },
                                        { key: "owner_column", label: t("owner-column", "Owner Column"), dataType: "string", width: 180 },
                                        //{ key: "acl", label: t("acl", "ACL"), dataType: "json", width: 200 },
                                    ] as ColumnDefinition[],
                                    pivotColumns: [
                                        { key: "property", label: t("property", "Property"), dataType: "string", width: 180 },
                                        { key: "value", label: t("value", "Value"), dataType: "string", width: 400 },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `sequences-details-grid-${session.profile.sch_id}`,
                                },
                                second: {
                                    id: cid("sequences-details-acl-content"),
                                    type: "content",
                                    title: {
                                        id: cid("sequences-details-acl-title"),
                                        type: "title",
                                        title: t("sequence-acl", "ACL"),
                                    },
                                    main: {
                                        id: cid("sequences-details-acl-grid"),
                                        type: "grid",
                                        rows: async () => {
                                            if (!selectedRowDetails) return [];
                                            return (selectedRowDetails.acl || []) as SequenceAclEntry[];
                                        },
                                        columns: [
                                            { key: "grantor", label: t("grantor", "Grantor"), dataType: "string", width: 200 },
                                            { key: "grantee", label: t("grantee", "Grantee"), dataType: "string", width: 200 },
                                            { key: "privilege_type", label: t("privilege-type", "Privilege Type"), dataType: "string", width: 200 },
                                            { key: "is_grantable", label: t("is-grantable", "Is Grantable"), dataType: "boolean", width: 150 },
                                        ] as ColumnDefinition[],
                                        autoSaveId: `sequences-details-acl-grid-${session.profile.sch_id}`,
                                    }
                                }
                            },
                        },
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