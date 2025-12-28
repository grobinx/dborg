import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { versionToNumber } from "src/api/version";

const publicationsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    return {
        id: cid("table-publications-tab"),
        type: "tab",
        label: {
            id: cid("table-publications-tab-label"),
            type: "tablabel",
            label: t("publications", "Publications"),
        },
        content: {
            id: cid("table-publications-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-publications-grid"),
                type: "grid",
                rows: async () => {
                    if (!selectedRow()) return [];

                    if (versionNumber < 100000) {
                        return t("logical-replication-available-from-postgresql-10", "Logical replication available from PostgreSQL 10+");
                    }

                    const { rows } = await session.query(
                        `
select
  p.pubname as publication_name,
  p.pubowner::regrole::text as owner,
  p.puballtables as all_tables,
  p.pubinsert as publish_insert,
  p.pubupdate as publish_update,
  p.pubdelete as publish_delete,
  case when pt.schemaname is not null then true else false end as table_included
from pg_publication p
left join pg_publication_tables pt
  on pt.pubname = p.pubname
 and pt.schemaname = $1
 and pt.tablename = $2
where p.puballtables or pt.schemaname is not null
order by p.pubname;
            `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "publication_name", label: t("publication", "Publication"), dataType: "string", width: 220 },
                    { key: "owner", label: t("owner", "Owner"), dataType: "string", width: 150 },
                    { key: "all_tables", label: t("all-tables", "All Tables"), dataType: "boolean", width: 110 },
                    { key: "publish_insert", label: t("insert", "Insert"), dataType: "boolean", width: 90 },
                    { key: "publish_update", label: t("update", "Update"), dataType: "boolean", width: 90 },
                    { key: "publish_delete", label: t("delete", "Delete"), dataType: "boolean", width: 90 },
                    { key: "table_included", label: t("included", "Included"), dataType: "boolean", width: 110 },
                ] as ColumnDefinition[],
                autoSaveId: `table-publications-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default publicationsTab;