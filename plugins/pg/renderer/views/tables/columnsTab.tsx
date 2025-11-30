import { Typography } from "@mui/material";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";

export interface TableColumnRecord {
    no: number;
    name: string;
    data_type: string;
    display_type: string;
    not_null: boolean;
    default_value: string | null;
    foreign_key: boolean;
    primary_key: boolean;
    unique: boolean;
    description: string | null;
    has_index: boolean;
    [key: string]: any;
}

const columnsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-columns-tab"),
        type: "tab",
        label: {
            id: cid("table-columns-tab-label"),
            type: "tablabel",
            label: t("columns", "Columns"),
        },
        content: {
            id: cid("table-columns-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-columns-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];
                    const { rows } = await session.query<TableColumnRecord>(`
                        select 
                            att.attnum as no, 
                            att.attname as name, 
                            att.atttypid::regtype::text as data_type,
                            pg_catalog.format_type(att.atttypid, att.atttypmod) as display_type,
                            att.attnotnull as not_null, 
                            pg_catalog.pg_get_expr(def.adbin, def.adrelid) as default_value,
                            exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='f' and att.attnum = any(conkey)) as foreign_key,
                            exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='p' and att.attnum = any(conkey)) as primary_key,
                            exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='u' and att.attnum = any(conkey)) as unique,
                            des.description as description,
                            exists (
                                select from pg_catalog.pg_index idx
                                where idx.indrelid = att.attrelid 
                                and att.attnum = any(idx.indkey)
                            ) as has_index
                        from pg_catalog.pg_attribute att
                            join pg_catalog.pg_class cl on cl.oid = att.attrelid
                            join pg_catalog.pg_namespace na on na.oid = cl.relnamespace
                            left outer join pg_catalog.pg_attrdef def on adrelid = att.attrelid and adnum = att.attnum
                            left outer join pg_catalog.pg_description des on des.classoid = 'pg_class'::regclass and des.objoid = att.attrelid and des.objsubid = att.attnum
                        where att.attnum > 0
                            and cl.relkind in ('r', 'f', 'p', 't', 'v', 'm')
                            and na.nspname not ilike 'pg_toast%' and na.nspname not ilike 'pg_temp%'
                            and na.nspname = $1
                            and cl.relname = $2
                            and att.atttypid != 0
                        order by no`,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "no", label: t("ordinal-number-short", "No"), width: 50, dataType: "number" },
                    { key: "name", label: t("name", "Name"), width: 160, dataType: "string" },
                    { key: "display_type", label: t("data-type", "Data Type"), width: 160, dataType: "string" },
                    {
                        key: "not_null",
                        label: t("null", "Null"),
                        width: 40,
                        dataType: "boolean",
                        formatter: (value: boolean) => (
                            <Typography component="span" variant="inherit" color={value ? "success" : "warning"}>
                                {value ? t("no", "No") : t("yes", "Yes")}
                            </Typography>
                        ),
                    },
                    { key: "default_value", label: t("default", "Default"), width: 120, dataType: "string" },
                    { key: "foreign_key", label: t("fk", "FK"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                    { key: "primary_key", label: t("pk", "PK"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                    { key: "unique", label: t("unq", "Unq"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                    { key: "has_index", label: t("idx", "Idx"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                    { key: "description", label: t("comment", "Comment"), width: 350, dataType: "string" },
                ] as ColumnDefinition[],
                autoSaveId: "table-columns-grid-" + session.profile.sch_id,
            } as IGridSlot),
        }
    };
};

export default columnsTab;