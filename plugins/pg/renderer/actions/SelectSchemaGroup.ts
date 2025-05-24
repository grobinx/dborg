import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext, DataGridContext } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { DatabasesMetadata, SchemaMetadata } from "src/api/db";

const sql =
    `select nspname schema_name
   from pg_namespace
  where nspname not ilike 'pg_toast%' 
    and nspname not ilike 'pg_temp%'
  order by nspname`;

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
            let schemas: string[] = [];

            if (session.metadata) {
                const database = session.metadata ? Object.values(session.metadata).find((db) => db.connected) : null;

                // Sortowanie schematów według nazwy
                schemas = Object.values(database?.schemas ?? {}).sort((a, b) =>
                    (a.name as string).localeCompare(b.name as string)
                ).map((schema) => schema.name as string);
            }
            else {
                try {
                    const { rows } = await session.query(sql);
                    if (rows.length !== 0) {
                        schemas = rows.map(row => (row as any).schema_name as string);
                    }
                } catch (error) {
                    console.error("Error fetching schemas:", error);
                }
            }

            schemas.forEach((schemaName) => {
                actions.push({
                    id: `dataGrid.pg.schema.${schemaName}`,
                    label: schemaName,
                    run: (context: DataGridActionContext<any>) => {
                        const currentSchemaName = context.getUserData('schema_name');
                        if (currentSchemaName !== schemaName) {
                            context.setUserData('schema_name', schemaName);
                            onSelectSchema(schemaName);
                            context.actionManager()?.executeAction(RefreshGridAction_ID, context);
                        }
                    },
                    selected: context => context.getUserData('schema_name') === schemaName,
                });
            });

            return actions;
        },
    };
}