import { Action, ActionGroup } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";

const sql =
    `select rolname role_name
   from pg_roles
  order by rolname`;

export const SelectRoleGroup = (
    session: IDatabaseSession,
    selectedRoleName: string | null,
    onSelectRole: (roleName: string) => void
): ActionGroup<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.pg.groups.selectRole";

    return {
        id: id,
        prefix: "ROLE:",
        label: t(id, "ROLE: Select Role"),
        mode: "actions",
        actions: async () => {
            const actions: Action<any>[] = [];
            let roles: string[] = [];

            console.debug('Fetching roles...', session.profile.sch_name);
            try {
                const { rows } = await session.query(sql);
                if (rows.length !== 0) {
                    roles = rows.map(row => (row as any).role_name as string);
                }
            } catch (error) {
                console.error("Error fetching roles:", error);
            }

            console.debug('roles:', roles);
            roles.forEach((roleName) => {
                actions.push({
                    id: `dataGrid.pg.role.${roleName}`,
                    label: roleName,
                    run: (context: DataGridActionContext<any>) => {
                        const currentRoleName = (context.getUserData('role_name') ?? selectedRoleName);
                        if (currentRoleName !== roleName) {
                            context.setUserData('role_name', roleName);
                            onSelectRole(roleName);
                            context.actionManager()?.executeAction(RefreshGridAction_ID, context);
                        }
                    },
                    selected: context => (context.getUserData('role_name') ?? selectedRoleName) === roleName,
                });
            });

            return actions;
        },
    };
}