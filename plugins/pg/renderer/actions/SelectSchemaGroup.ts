import { Action, ActionGroup } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { DatabaseMetadata } from "src/api/db";

const sql =
    `select nspname schema_name
   from pg_namespace
  where nspname not ilike 'pg_toast%' 
    and nspname not ilike 'pg_temp%'
  order by nspname`;

export const SelectSchemaGroup = (
    session: IDatabaseSession,
    selectedSchemaName: string | null,
    onSelectSchema: (schemaName: string) => void
): ActionGroup<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.pg.groups.selectSchema";

    return {
        id: id,
        prefix: "SCHEMA:",
        label: t(id, "SCHEMA: Select schema"),
        mode: "actions",
        actions: async () => {
            const actions: Action<any>[] = [];
            let schemas: string[] = [];

            const metadata = await session.getMetadataQuery();

            if (metadata.status === "ready") {
                const foundSchemas: string[] = [];

                for (const database of await metadata.getDatabaseList({ filter: { connected: true } })) {
                    const schemas = await database.getSchemaList();
                    foundSchemas.push(...schemas.map(schema => schema.name));
                }

                if (foundSchemas.length > 0) {
                    schemas = foundSchemas.sort((a, b) => a.localeCompare(b));
                }
            } else {
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
                        const currentSchemaName = (context.getUserData('schema_name') ?? selectedSchemaName);
                        if (currentSchemaName !== schemaName) {
                            context.setUserData('schema_name', schemaName);
                            onSelectSchema(schemaName);
                            context.actionManager()?.executeAction(RefreshGridAction_ID, context);
                        }
                    },
                    selected: context => (context.getUserData('schema_name') ?? selectedSchemaName) === schemaName,
                });
            });

            return actions;
        },
    };
}