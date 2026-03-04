import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IGridSlot, IPinnableTabSlot } from "plugins/manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { FunctionRecord } from "./functionsView";

interface FunctionDetailsRow {
    schema_name: string;
    function_name: string;
    identity_args: string;
    result_type: string;
    language_name: string;
    security_type: string;
    volatility: string;
    parallel_safety: string;
    estimated_cost: number;
    estimated_rows: number | null;
    leakproof: boolean;
    strict: boolean;
    [key: string]: any;
}

const functionDetailsTab = (
    session: IDatabaseSession,
    selectedFunction: () => FunctionRecord | null,
    cid: (id: string) => string
): IPinnableTabSlot => {
    const t = i18next.t.bind(i18next);

    return {
        id: cid("function-details-tab"),
        type: "tab",
        label: {
            id: cid("function-details-tab-label"),
            type: "tablabel",
            label: t("details", "Details"),
        },
        content: {
            id: cid("function-details-tab-content"),
            type: "tabcontent",
            content: (slotContext) => ({
                id: cid("function-details-split"),
                type: "split",
                direction: "vertical",
                secondSize: 35,
                first: () =>
                    ({
                        id: cid("function-details-grid"),
                        type: "grid",
                        pivot: true,
                        rows: async () => {
                            const f = selectedFunction();
                            if (!f) return [];
                            const { rows } = await session.query<FunctionDetailsRow>(
                                `
                                select
                                    n.nspname as schema_name,
                                    p.proname as function_name,
                                    pg_get_function_identity_arguments(p.oid) as identity_args,
                                    pg_get_function_result(p.oid) as result_type,
                                    l.lanname as language_name,
                                    case when p.prosecdef then 'definer' else 'invoker' end as security_type,
                                    case p.provolatile when 'i' then 'immutable' when 's' then 'stable' else 'volatile' end as volatility,
                                    case p.proparallel when 's' then 'safe' when 'r' then 'restricted' else 'unsafe' end as parallel_safety,
                                    p.procost as estimated_cost,
                                    case when p.proretset then p.prorows else null end as estimated_rows,
                                    p.proleakproof as leakproof,
                                    p.proisstrict as strict
                                from pg_proc p
                                join pg_namespace n on n.oid = p.pronamespace
                                join pg_language l on l.oid = p.prolang
                                where p.oid = $1
                                `,
                                [f.oid]
                            );
                            return rows;
                        },
                        columns: [
                            { key: "schema_name", label: t("schema-name", "Schema Name"), width: 150, dataType: "string" },
                            { key: "function_name", label: t("function-name", "Function Name"), width: 180, dataType: "string" },
                            { key: "identity_args", label: t("arguments", "Arguments"), width: 220, dataType: "string" },
                            { key: "result_type", label: t("result-type", "Result Type"), width: 140, dataType: "string" },
                            { key: "language_name", label: t("language", "Language"), width: 100, dataType: "string" },
                            { key: "security_type", label: t("security", "Security"), width: 100, dataType: "string" },
                            { key: "volatility", label: t("volatility", "Volatility"), width: 100, dataType: "string" },
                            { key: "parallel_safety", label: t("parallel-safety", "Parallel Safety"), width: 120, dataType: "string" },
                            { key: "estimated_cost", label: t("estimated-cost", "Estimated Cost"), width: 100, dataType: "number" },
                            { key: "estimated_rows", label: t("estimated-rows", "Estimated Rows"), width: 100, dataType: "number" },
                            { key: "leakproof", label: t("leakproof", "Leakproof"), width: 80, dataType: "boolean" },
                            { key: "strict", label: t("strict", "Strict"), width: 80, dataType: "boolean" },
                        ] as ColumnDefinition[],
                        pivotColumns: [
                            { key: "detail", label: t("details", "Details"), width: 240, dataType: "string" },
                            { key: "value", label: t("value", "Value"), width: 450, dataType: "string" },
                        ],
                        autoSaveId: `function-details-grid-${session.profile.sch_id}`,
                    } as IGridSlot),
                second: () => ({
                    id: cid("function-alter-script"),
                    type: "editor",
                    readOnly: true,
                    wordWrap: true,
                    lineNumbers: false,
                    statusBar: false,
                    miniMap: false,
                    content: async () => {
                        const f = selectedFunction();
                        if (!f) return "-- " + t("no-function-selected", "No function selected.");

                        return [
                            `-- Quick alter template`,
                            `ALTER FUNCTION ${f.schema_name}.${f.function_name}(${f.identity_args})`,
                            `  OWNER TO ${f.owner_name};`,
                            ``,
                            `-- Examples:`,
                            `-- ALTER FUNCTION ${f.schema_name}.${f.function_name}(${f.identity_args}) VOLATILE;`,
                            `-- ALTER FUNCTION ${f.schema_name}.${f.function_name}(${f.identity_args}) SECURITY DEFINER;`,
                            `-- COMMENT ON FUNCTION ${f.schema_name}.${f.function_name}(${f.identity_args}) IS '...';`,
                        ].join("\n");
                    },
                }),
                autoSaveId: `function-details-split-${session.profile.sch_id}`,
            }),
        },
    };
};

export default functionDetailsTab;