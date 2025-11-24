import { Typography } from "@mui/material";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IContentSlot, IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const indexesTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    const cid = (id: string) => {
        return `${id}-${session.info.uniqueId}`;
    }

    return {
        id: cid("table-indexes-tab"),
        type: "tab",
        label: {
            id: cid("table-indexes-tab-label"),
            type: "tablabel",
            label: t("indexes", "Indexes"),
        },
        content: {
            id: cid("table-indexes-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-indexes-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) {
                        return [];
                    }
                    const { rows } = await session.query(`
                        select 
                            c.relname as index_name,
                            i.indisunique = 'Y' as unique,
                            i.indisclustered = 'Y' as clustered, 
                            i.indisprimary = 'Y' as primary_key,
                            exists (select from pg_constraint con where con.conindid = i.indexrelid and con.contype = 'f') as foreign_key,
                            am.amname as index_type,
                            coalesce(
                                '('||array_to_string(array(select pg_get_indexdef(i.indexrelid, k + 1, true) from generate_subscripts(i.indkey, 1) as k order by k), ', ')||') WHERE '||pg_get_expr(i.indpred, i.indrelid, true),
                                array_to_string(array(select pg_get_indexdef(i.indexrelid, k + 1, true) from generate_subscripts(i.indkey, 1) as k order by k), ', ')
                            ) as index_expr,
                            d.description as description
                        from 
                            pg_index i
                            join pg_class c on c.oid = i.indexrelid
                            join pg_class t on t.oid = i.indrelid
                            join pg_am am on c.relam = am.oid
                            join pg_namespace ns on ns.oid = c.relnamespace
                            left join pg_tablespace s on s.oid = c.reltablespace
                            left join pg_description d on d.classoid = 'pg_class'::regclass and d.objoid = c.oid and d.objsubid = 0
                        where
                            ns.nspname = $1 and
                            t.relname = $2
                        order by index_name`,
                        [schemaName(), tableName()]
                    );
                    return rows;
                },
                columns: [
                    {
                        key: "index_name",
                        label: t("index-name", "Index Name"),
                        dataType: "string",
                        width: 200,
                    },
                    {
                        key: "unique",
                        label: t("unq", "Unq"),
                        dataType: "boolean",
                        width: 40,
                        formatter: (value: boolean) => value ? t("yes", "Yes") : "",
                    },
                    {
                        key: "clustered",
                        label: t("clustered", "Clustered"),
                        dataType: "boolean",
                        width: 40,
                        formatter: (value: boolean) => value ? t("yes", "Yes") : "",
                    },
                    {
                        key: "primary_key",
                        label: t("pk", "PK"),
                        dataType: "boolean",
                        width: 40,
                        formatter: (value: boolean) => value ? t("yes", "Yes") : "",
                    },
                    {
                        key: "foreign_key",
                        label: t("fk", "FK"),
                        dataType: "boolean",
                        width: 40,
                        formatter: (value: boolean) => value ? t("yes", "Yes") : "",
                    },
                    {
                        key: "index_type",
                        label: t("index-type", "Index Type"),
                        dataType: "string",
                        width: 120,
                    },
                    {
                        key: "index_expr",
                        label: t("index-expression", "Index Expression"),
                        dataType: "string",
                        width: 300,
                    },
                    {
                        key: "description",
                        label: t("comment", "Comment"),
                        dataType: "string",
                        width: 350,
                    },
                ] as ColumnDefinition[],
                autoSaveId: `table-indexes-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        }
    };
};

export default indexesTab;