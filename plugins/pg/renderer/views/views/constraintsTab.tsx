import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ViewRecord } from "./viewsView";

const constraintsTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("view-constraints-tab"),
        type: "tab",
        label: {
            id: cid("view-constraints-tab-label"),
            type: "tablabel",
            label: t("constraints", "Constraints"),
        },
        content: {
            id: cid("view-constraints-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-constraints-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];
                    const { rows } = await session.query(
                        `select 
                            con.conname as constraint_name,
                            case con.contype
                                when 'c' then 'check'
                                when 't' then 'trigger'
                                when 'x' then 'exclude'
                                when 'u' then 'unique'
                                when 'p' then 'primary key'
                                when 'f' then 'foreign key'
                                else con.contype::varchar
                            end as type,
                            pg_get_constraintdef(con.oid) as expression,
                            pg_catalog.obj_description(con.oid, 'pg_constraint') as description
                        from 
                            pg_constraint con
                            join pg_class ct on con.conrelid = ct.oid
                            join pg_namespace n on ct.relnamespace = n.oid
                        where 
                            n.nspname = $1
                            and ct.relname = $2
                        order by constraint_name`,
                        [selectedRow()!.schema_name, selectedRow()!.view_name]
                    );
                    return rows;
                },
                columns: [
                    {
                        key: "constraint_name",
                        label: t("constraint-name", "Constraint Name"),
                        dataType: "string",
                        width: 220,
                    },
                    {
                        key: "type",
                        label: t("type", "Type"),
                        dataType: "string",
                        width: 120,
                    },
                    {
                        key: "expression",
                        label: t("expression", "Expression"),
                        dataType: "string",
                        width: 360,
                    },
                    {
                        key: "description",
                        label: t("comment", "Comment"),
                        dataType: "string",
                        width: 350,
                    },
                ] as ColumnDefinition[],
                autoSaveId: `view-constraints-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default constraintsTab;