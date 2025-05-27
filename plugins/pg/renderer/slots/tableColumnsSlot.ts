import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IGridSlot } from "plugins/manager/renderer/CustomSlots";

export interface TableColumnRecord {
    no: number;
    name: string;
    data_type: string;
    display_type: string;
    nullable: boolean;
    default_value: string | null;
    foreign_key: boolean;
    primary_key: boolean;
    unique: boolean;
    description: string | null;
}

const tableColumnsSlot = (
    session: IDatabaseSession,
    schemaName: string | null,
    tableName: string | null
): IGridSlot => {
    return {
        id: `tableColumns-${session.info.uniqueId}`,
        type: "grid",
        mode: "defined",
        rows: async () => {
            if (!schemaName || !tableName) {
                return [];
            }
            const { rows } = await session.query(`
                select 
                    att.attnum as no, 
                    att.attname as name, 
                    att.atttypid::regtype::text as data_type,
                    pg_catalog.format_type(att.atttypid, att.atttypmod) as display_type,
                    att.attnotnull as nullable, 
                    pg_catalog.pg_get_expr(def.adbin, def.adrelid) as default_value,
                    exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='f' and att.attnum = any(conkey)) as foreign_key,
                    exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='p' and att.attnum = any(conkey)) as primary_key,
                    exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='u' and att.attnum = any(conkey)) as unique,
                    des.description as description
                from pg_catalog.pg_attribute att
                    join pg_catalog.pg_class cl on cl.oid = att.attrelid
                    join pg_catalog.pg_namespace na on na.oid = cl.relnamespace
                    left outer join pg_catalog.pg_attrdef def on adrelid = att.attrelid and adnum = att.attnum
                    left outer join pg_catalog.pg_description des on des.classoid = 'pg_class'::regclass and des.objoid = att.attrelid and des.objsubid = att.attnum
                    --left join pg_catalog.pg_inherits inh on cl.oid = inh.inhrelid
                where att.attnum > 0
                    and cl.relkind in ('r', 'f', 'p', 't', 'v', 'm')
                    and na.nspname not ilike 'pg_toast%' and na.nspname not ilike 'pg_temp%'
                    and na.nspname = $1
                    and cl.relname = $2
                    --and inh.inhrelid is null
                order by no`,
                [schemaName, tableName]
            );
            return rows;
        },
        columns: [
            {
                key: "no",
                label: "No",
                width: 50,
                dataType: "number",
            },
            {
                key: "name",
                label: "Name",
                width: 160,
                dataType: "string",
            },
            {
                key: "display_type",
                label: "Data Type",
                width: 160,
                dataType: "string",
            },
            {
                key: "nullable",
                label: "Null",
                width: 40,
                dataType: "boolean",
                formatter: (value: boolean) => value ? "No" : "Yes",
            },
            {
                key: "default_value",
                label: "Default",
                width: 120,
                dataType: "string",
            },
            {
                key: "foreign_key",
                label: "FK",
                width: 40,
                dataType: "boolean",
                formatter: (value: boolean) => value ? "Yes" : "",
            },
            {
                key: "primary_key",
                label: "PK",
                width: 40,
                dataType: "boolean",
                formatter: (value: boolean) => value ? "Yes" : "",
            },
            {
                key: "unique",
                label: "Unq",
                width: 40,
                dataType: "boolean",
                formatter: (value: boolean) => value ? "Yes" : "",
            },
            {
                key: "description",
                label: "Description",
                width: 350,
                dataType: "string",
            },
        ] as ColumnDefinition[],
        storeLayoutId: "table-columns-grid-" + session.schema.sch_id,
    };
};

export default tableColumnsSlot;