import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { IGridSlot, ITextSlot, ITitleSlot } from "plugins/manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { functionView } from "./functionView";
import { versionToNumber } from "../../../../../src/api/version";

export interface FunctionRecord {
    schema_name: string;
    function_name: string;
    identity_args: string;
    result_type: string;
    function_kind: "function" | "procedure" | "aggregate" | "window" | null;
    language_name: string;
    owner_name: string;
    security_type: "definer" | "invoker";
    volatility: "immutable" | "stable" | "volatile" | null;
    identifier: string;
    description: string | null;
    oid: number;
    [key: string]: any;
}

export function functionsView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    let selectedSchemaName: string | null = null;
    let selectedRow: FunctionRecord | null = null;

    const setSelectedSchemaName = async () => {
        const { rows } = await session.query<{ schema_name: string }>("select current_schema() as schema_name");
        selectedSchemaName = rows[0]?.schema_name ?? null;
    };
    setSelectedSchemaName();

    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        type: "connection",
        id: cid("functions-view"),
        icon: "Code",
        label: t("database-functions", "Functions"),
        slot: {
            id: cid("functions-slot"),
            type: "integrated",
            side: {
                id: cid("functions-side"),
                type: "content",
                title: {
                    id: cid("functions-title"),
                    type: "title",
                    icon: "Code",
                    title: () => t("pg-functions-with-schema", "Functions {{schemaName}}", { schemaName: selectedSchemaName }),
                    toolBar: {
                        id: cid("functions-title-toolbar"),
                        type: "toolbar",
                        tools: [SelectSchemaAction_ID],
                        actionSlotId: cid("functions-grid"),
                    },
                } as ITitleSlot,
                main: {
                    id: cid("functions-grid"),
                    type: "grid",
                    uniqueField: "identifier",
                    rows: async () => {
                        const { rows } = await session.query<FunctionRecord>(
                            `
                            select
                                n.nspname as schema_name,
                                p.proname as function_name,
                                pg_get_function_identity_arguments(p.oid) as identity_args,
                                pg_get_function_result(p.oid) as result_type,
                                l.lanname as language_name,
                                pg_get_userbyid(p.proowner) as owner_name,
                                case when p.prosecdef then 'definer' else 'invoker' end as security_type,
                                case p.provolatile
                                    when 'i' then 'immutable'
                                    when 's' then 'stable'
                                    when 'v' then 'volatile'
                                end as volatility,
                                d.description,
                                p.oid,
                                format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as identifier
                            from pg_proc p
                            join pg_namespace n on n.oid = p.pronamespace
                            join pg_language l on l.oid = p.prolang
                            left join pg_description d on d.objoid = p.oid and d.classoid = 'pg_proc'::regclass and d.objsubid = 0
                            where
                                ${versionNumber >= 110000 ? "p.prokind = 'f'" : "not p.proisagg"}
                                and (n.nspname = $1
                                 or (n.nspname = any(current_schemas(false))
                                     and coalesce($1, current_schema()) = current_schema()
                                     and n.nspname <> 'public'))
                            order by n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
                            `,
                            [selectedSchemaName]
                        );
                        return rows;
                    },
                    columns: [
                        { label: t("function-name", "Function Name"), key: "function_name", dataType: "string", width: 170 },
                        { label: t("schema-name", "Schema Name"), key: "schema_name", dataType: "string", width: 150 },
                        { label: t("arguments", "Arguments"), key: "identity_args", dataType: "string", width: 220 },
                        { label: t("result-type", "Result Type"), key: "result_type", dataType: "string", width: 140 },
                        { label: t("language", "Language"), key: "language_name", dataType: "string", width: 90 },
                        { label: t("owner-name", "Owner Name"), key: "owner_name", dataType: "string", width: 120 },
                    ] as ColumnDefinition[],
                    onRowSelect: (row: FunctionRecord | undefined, slotContext) => {
                        selectedRow = row ?? null;
                        slotContext.refresh(cid("functions-text"));
                        slotContext.refresh(cid("function-tab-label"));
                        slotContext.refresh(cid("function-details-grid"));
                        slotContext.refresh(cid("function-ddl-editor"));
                        slotContext.refresh(cid("function-alter-script"));
                    },
                    actions: [SelectSchemaAction()],
                    actionGroups: (slotContext) => [
                        SelectSchemaGroup(session, selectedSchemaName, (schemaName: string) => {
                            selectedSchemaName = schemaName;
                            slotContext.refresh(cid("functions-grid"));
                            slotContext.refresh(cid("functions-title"));
                        }),
                    ],
                    autoSaveId: `functions-grid-${session.profile.sch_id}`,
                    statuses: ["data-rows"],
                } as IGridSlot,
                text: {
                    id: cid("functions-text"),
                    type: "text",
                    text: () => (selectedRow?.description ? selectedRow.description : t("no-description", "No description.")),
                    maxLines: 3,
                } as ITextSlot,
            },
            editors: [functionView(session, () => selectedRow, false)],
        },
    };
}