import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext, DataGridContext } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshConnectionDataGrid_ID } from "@renderer/containers/Connections/ConnectionView/ViewSlots/actions/RefreshConnectionDataGrid";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next, { TFunction } from "i18next";

const sql =
    `select nspname schema_name
   from pg_namespace
  where nspname not ilike 'pg_toast%' 
    and nspname not ilike 'pg_temp%'
  order by nspname`;

interface SchemaRecord {
    schema_name: string;
}

export const SelectSchemaGroup = (
    session: IDatabaseSession,
    onSelectSchema: (schemaName: string) => void
): ActionGroupDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.pg.groups.selectSchema";

    return {
        id: id,
        prefix: "#",
        label: t(id, "# Select schema"),
        actions: async () => {
            const actions: ActionDescriptor<any>[] = [];
            try {
                const { rows } = await session.query(sql);
                for (let row of rows) {
                    actions.push({
                        id: `dataGrid.pg.schema.${row.schema_name}`,
                        label: row.schema_name as string,
                        run: (context: DataGridActionContext<any>) => {
                            context.setUserData('schema_name', row.schema_name as string);
                            onSelectSchema(row.schema_name as string);
                            context.actionManager()?.executeAction(RefreshConnectionDataGrid_ID, context);
                        },
                        selected: context => context.getUserData('schema_name') === row.schema_name,
                    });
                }
            } catch (error) {
                // TODO: Lepiej obsłużyć błąd
                console.error("Error fetching schemas:", error);
                actions.push({
                    id: "dataGrid.pg.schema.error",
                    label: t("dataGrid.pg.schema.error", "Error fetching schemas"),
                    run: () => {
                        console.error("Error fetching schemas:", error);
                    },
                });
            }
            return actions;
        },
    };
}