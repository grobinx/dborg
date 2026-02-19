import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";

export async function tablespaceDdl(session: IDatabaseSession, tablespaceName: string): Promise<string> {
    const sql = `
select
    t.oid,
    t.spcname,
    pg_get_userbyid(t.spcowner) as owner_name,
    pg_tablespace_location(t.oid) as location,
    t.spcoptions,
    shobj_description(t.oid, 'pg_tablespace') as comment,
    (t.spcname in ('pg_default', 'pg_global')) as is_system
from pg_tablespace t
where t.spcname = $1;
`;
    const { rows } = await session.query<{
        oid: number;
        spcname: string;
        owner_name: string;
        location: string | null;
        spcoptions: string[] | null;
        comment: string | null;
        is_system: boolean;
    }>(sql, [tablespaceName]);

    const row = rows[0];
    if (!row) return `-- Tablespace not found: ${tablespaceName}`;

    const lines: string[] = [];
    lines.push(`-- Tablespace: ${row.spcname}`);

    if (row.is_system) {
        lines.push(`-- System tablespace (cannot be created/dropped manually).`);
        lines.push(`-- Owner: ${row.owner_name}`);
        if (row.comment) {
            lines.push(`COMMENT ON TABLESPACE ${qIdent(row.spcname)} IS ${qLiteral(row.comment)};`);
        }
        return lines.join("\n");
    }

    lines.push(
        `CREATE TABLESPACE ${qIdent(row.spcname)} OWNER ${qIdent(row.owner_name)} LOCATION ${qLiteral(row.location || "")}${optionsToSql(row.spcoptions)};`
    );

    if (row.comment) {
        lines.push(`COMMENT ON TABLESPACE ${qIdent(row.spcname)} IS ${qLiteral(row.comment)};`);
    }

    return lines.join("\n");
}

const qIdent = (v: string) => `"${String(v).replace(/"/g, `""`)}"`;
const qLiteral = (v: string) => `'${String(v).replace(/'/g, `''`)}'`;

function optionsToSql(options: string[] | null | undefined): string {
    if (!options?.length) return "";
    return ` WITH (${options.join(", ")})`;
}

