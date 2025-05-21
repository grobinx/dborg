import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext, DataGridContext } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshConnectionDataGrid_ID } from "@renderer/containers/Connections/ConnectionView/ViewSlots/actions/RefreshConnectionDataGrid";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { DatabasesMetadata, SchemaMetadata } from "src/api/db";

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
            const database = session.metadata ? Object.values(session.metadata).find((db) => db.connected) : null;

            // Sortowanie schematów według nazwy
            const sortedSchemas = Object.values(database?.schemas ?? {}).sort((a, b) =>
                (a.name as string).localeCompare(b.name as string)
            );

            sortedSchemas.forEach((schema: SchemaMetadata) => {
                actions.push({
                    id: `dataGrid.pg.schema.${schema.name}`,
                    label: schema.name as string,
                    run: (context: DataGridActionContext<any>) => {
                        const schemaName = context.getUserData('schema_name');
                        if (schemaName !== schema.name) {
                            context.setUserData('schema_name', schema.name as string);
                            onSelectSchema(schema.name as string);
                            context.actionManager()?.executeAction(RefreshConnectionDataGrid_ID, context);
                        }
                    },
                    selected: context => context.getUserData('schema_name') === schema.name,
                });
            });

            return actions;
        },
    };
}