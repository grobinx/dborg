import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { IGridSlot } from "plugins/manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { versionToNumber } from "../../../../../src/api/version";
import { aggregateDdl } from "../../../common/ddls/aggregate";

export interface AggregateRecord {
    aggregate_schema: string;
    aggregate_name: string;
    aggregate_signature: string;
    arguments: string;
    return_type: string | null;
    owner: string | null;
    language: string | null;
    comment: string | null;
    [key: string]: any;
}

export interface AggregateAclEntry {
    grantor: string | null;
    grantee: string | null;
    privilege_type: string | null;
    is_grantable: boolean | null;
}

export interface AggregateDetailsRecord {
    oid: number;
    aggregate_schema: string;
    aggregate_name: string;
    arguments: string;
    return_type: string | null;
    owner: string | null;
    comment: string | null;
    sfunc: string | null;
    stype: string | null;
    finalfunc: string | null;
    combinefunc: string | null;
    serialfunc: string | null;
    deserialfunc: string | null;
    mtransfunc: string | null;
    minvtransfunc: string | null;
    mfinalfunc: string | null;
    mstype: string | null;
    initcond: string | null;
    minitcond: string | null;
    aggkind: string | null;
    acl: AggregateAclEntry[];
    [key: string]: any;
}

export function aggregatesView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    let selectedSchemaName: string | null = null;
    let selectedRow: AggregateRecord | null = null;
    let selectedRowDetails: AggregateDetailsRecord | null = null;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    const setSelectedSchemaName = async () => {
        const { rows } = await session.query<{ schema_name: string }>("select current_schema() as schema_name");
        selectedSchemaName = rows[0]?.schema_name ?? null;
    };
    setSelectedSchemaName();

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        type: "connection",
        id: cid("aggregates-view"),
        icon: "Aggregates",
        label: t("database-aggregates", "Aggregates"),
        slot: {
            id: cid("aggregates-slot"),
            type: "root",
            slot: {
                id: cid("aggregates-content"),
                type: "content",
                title: {
                    type: "title",
                    id: cid("aggregates-title"),
                    title: () => t("pg-aggregates-with-schema", "Aggregates {{schemaName}}", { schemaName: selectedSchemaName }),
                    toolBar: {
                        id: cid("aggregates-toolbar"),
                        type: "toolbar",
                        tools: [SelectSchemaAction_ID],
                        actionSlotId: cid("aggregates-grid"),
                    },
                },
                main: {
                    id: cid("aggregates-main-splitter"),
                    type: "split",
                    direction: "horizontal",
                    autoSaveId: `aggregates-main-splitter-${session.profile.sch_id}`,
                    secondSize: 25,
                    first: {
                        id: cid("aggregates-editor-splitter"),
                        type: "split",
                        direction: "vertical",
                        autoSaveId: `aggregates-editor-splitter-${session.profile.sch_id}`,
                        secondSize: 25,
                        first: {
                            id: cid("aggregates-grid"),
                            type: "grid",
                            uniqueField: "aggregate_signature",
                            rows: async () => {
                                const sql11plus = `
select
    n.nspname as aggregate_schema,
    p.proname as aggregate_name,
    (p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')') as aggregate_signature,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    pg_get_userbyid(p.proowner) as owner,
    l.lanname as language,
    obj_description(p.oid, 'pg_proc') as comment
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join pg_language l on l.oid = p.prolang
where p.prokind = 'a'
  and (
    n.nspname = $1
    or (
      n.nspname = any(current_schemas(false))
      and coalesce($1, current_schema()) = current_schema()
      and n.nspname <> 'public'
    )
  )
order by aggregate_schema, aggregate_name, arguments;
`;

                                const sqlLegacy = `
select
    n.nspname as aggregate_schema,
    p.proname as aggregate_name,
    (p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')') as aggregate_signature,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    pg_get_userbyid(p.proowner) as owner,
    l.lanname as language,
    obj_description(p.oid, 'pg_proc') as comment
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_aggregate a on a.aggfnoid = p.oid
left join pg_language l on l.oid = p.prolang
where (
    n.nspname = $1
    or (
      n.nspname = any(current_schemas(false))
      and coalesce($1, current_schema()) = current_schema()
      and n.nspname <> 'public'
    )
)
order by aggregate_schema, aggregate_name, arguments;
`;

                                const sql = versionNumber >= 110000 ? sql11plus : sqlLegacy;
                                const { rows } = await session.query<AggregateRecord>(sql, [selectedSchemaName]);
                                return rows;
                            },
                            columns: [
                                { key: "aggregate_name", label: t("aggregate-name", "Aggregate"), dataType: "string", width: 220 },
                                { key: "aggregate_schema", label: t("schema-name", "Schema"), dataType: "string", width: 150 },
                                { key: "arguments", label: t("arguments", "Arguments"), dataType: "string", width: 260 },
                                { key: "return_type", label: t("return-type", "Return Type"), dataType: "string", width: 150 },
                                { key: "owner", label: t("owner", "Owner"), dataType: "string", width: 160 },
                                { key: "language", label: t("language", "Language"), dataType: "string", width: 120 },
                                { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                            ] as ColumnDefinition[],
                            onRowSelect: (row: AggregateRecord | undefined, slotContext) => {
                                if (selectedRow?.aggregate_signature !== row?.aggregate_signature) {
                                    selectedRow = row ?? null;
                                    slotContext.refresh(cid("aggregates-editor"));
                                    slotContext.refresh(cid("aggregates-details-grid"));
                                }
                            },
                            actions: [SelectSchemaAction()],
                            actionGroups: (slotContext) => [
                                SelectSchemaGroup(session, selectedSchemaName, (schemaName: string) => {
                                    selectedSchemaName = schemaName;
                                    slotContext.refresh(cid("aggregates-grid"));
                                    slotContext.refresh(cid("aggregates-title"));
                                }),
                            ],
                            autoSaveId: `aggregates-grid-${session.profile.sch_id}`,
                            statuses: ["data-rows"],
                        } as IGridSlot,
                        second: {
                            id: cid("aggregates-editor"),
                            type: "editor",
                            lineNumbers: false,
                            readOnly: true,
                            miniMap: false,
                            content: async () => {
                                if (!selectedRow) return "-- No aggregate selected";
                                return aggregateDdl(
                                    session,
                                    selectedRow.aggregate_schema,
                                    selectedRow.aggregate_name,
                                    selectedRow.arguments
                                );
                            },
                        },
                    },
                    second: {
                        id: cid("aggregates-details-splitter"),
                        type: "split",
                        direction: "vertical",
                        autoSaveId: `aggregates-details-splitter-${session.profile.sch_id}`,
                        first: {
                            id: cid("aggregates-details-grid"),
                            type: "grid",
                            pivot: true,
                            rows: async (slotContext) => {
                                if (!selectedRow) return [];

                                const sql = `
with x as (
    select
        p.oid,
        n.nspname as aggregate_schema,
        p.proname as aggregate_name,
        pg_get_function_identity_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type,
        pg_get_userbyid(p.proowner) as owner,
        obj_description(p.oid, 'pg_proc') as comment,
        a.aggtransfn::regproc::text as sfunc,
        format_type(a.aggtranstype, null) as stype,
        a.aggfinalfn::regproc::text as finalfunc,
        a.aggcombinefn::regproc::text as combinefunc,
        a.aggserialfn::regproc::text as serialfunc,
        a.aggdeserialfn::regproc::text as deserialfunc,
        a.aggmtransfn::regproc::text as mtransfunc,
        a.aggminvtransfn::regproc::text as minvtransfunc,
        a.aggmfinalfn::regproc::text as mfinalfunc,
        format_type(a.aggmtranstype, null) as mstype,
        a.agginitval as initcond,
        a.aggminitval as minitcond,
        a.aggkind::text as aggkind,
        coalesce(
            (
                select json_agg(row_to_json(z))
                from (
                    select
                        pg_get_userbyid(grantor) as grantor,
                        pg_get_userbyid(grantee) as grantee,
                        privilege_type,
                        is_grantable
                    from aclexplode(p.proacl)
                ) z
            ),
            '[]'::json
        ) as acl
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_aggregate a on a.aggfnoid = p.oid
    where n.nspname = $1
      and p.proname = $2
      and pg_get_function_identity_arguments(p.oid) = $3
    limit 1
)
select * from x;
`;
                                selectedRowDetails = null;
                                const { rows } = await session.query<AggregateDetailsRecord>(sql, [
                                    selectedRow.aggregate_schema,
                                    selectedRow.aggregate_name,
                                    selectedRow.arguments,
                                ]);
                                if (!rows.length) return [];

                                selectedRowDetails = rows[0];
                                slotContext.refresh(cid("aggregates-details-acl-grid"));
                                return rows;
                            },
                            columns: [
                                { key: "aggregate_schema", label: t("schema-name", "Schema"), dataType: "string", width: 150 },
                                { key: "aggregate_name", label: t("aggregate-name", "Aggregate"), dataType: "string", width: 220 },
                                { key: "arguments", label: t("arguments", "Arguments"), dataType: "string", width: 260 },
                                { key: "return_type", label: t("return-type", "Return Type"), dataType: "string", width: 150 },
                                { key: "owner", label: t("owner", "Owner"), dataType: "string", width: 160 },
                                { key: "sfunc", label: t("sfunc", "State Func"), dataType: "string", width: 180 },
                                { key: "stype", label: t("stype", "State Type"), dataType: "string", width: 160 },
                                { key: "finalfunc", label: t("finalfunc", "Final Func"), dataType: "string", width: 180 },
                                { key: "combinefunc", label: t("combinefunc", "Combine Func"), dataType: "string", width: 180 },
                                { key: "serialfunc", label: t("serialfunc", "Serial Func"), dataType: "string", width: 180 },
                                { key: "deserialfunc", label: t("deserialfunc", "Deserial Func"), dataType: "string", width: 180 },
                                { key: "initcond", label: t("initcond", "Init Cond"), dataType: "string", width: 160 },
                                { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                            ] as ColumnDefinition[],
                            pivotColumns: [
                                { key: "property", label: t("property", "Property"), dataType: "string", width: 180 },
                                { key: "value", label: t("value", "Value"), dataType: "string", width: 420 },
                            ] as ColumnDefinition[],
                            autoSaveId: `aggregates-details-grid-${session.profile.sch_id}`,
                        },
                        second: {
                            id: cid("aggregates-details-acl-content"),
                            type: "content",
                            title: {
                                id: cid("aggregates-details-acl-title"),
                                type: "title",
                                title: t("aggregate-acl", "ACL"),
                            },
                            main: {
                                id: cid("aggregates-details-acl-grid"),
                                type: "grid",
                                rows: async () => {
                                    if (!selectedRowDetails) return [];
                                    return (selectedRowDetails.acl || []) as AggregateAclEntry[];
                                },
                                columns: [
                                    { key: "grantor", label: t("grantor", "Grantor"), dataType: "string", width: 200 },
                                    { key: "grantee", label: t("grantee", "Grantee"), dataType: "string", width: 200 },
                                    { key: "privilege_type", label: t("privilege-type", "Privilege Type"), dataType: "string", width: 200 },
                                    { key: "is_grantable", label: t("is-grantable", "Is Grantable"), dataType: "boolean", width: 150 },
                                ] as ColumnDefinition[],
                                autoSaveId: `aggregates-details-acl-grid-${session.profile.sch_id}`,
                            },
                        },
                    },
                },
            },
        },
    };
}