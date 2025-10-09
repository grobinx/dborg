import path from "node:path";
import * as consts from "../../../api/consts";
import { Connection, Driver } from "../../api/db";
import { dataPath as dborgPath } from '../../api/dborg-path'
import Version from "../../../api/version";
import { uuidv7 } from "uuidv7";
import { CommandResult, QueryResult } from "../../../api/db";
import { DateTime } from "luxon";

export interface InternalConnection {
    setConnection(connection: Connection): void;
    query(sql: string, values?: unknown[]): Promise<QueryResult>;
    execute(sql: string, values?: unknown[]): Promise<CommandResult>;
    isConnected(): boolean;
}

export class Internal implements InternalConnection {
    private connection?: Connection;

    constructor() {
    }

    setConnection(connection: Connection): void {
        this.connection = connection;
    }

    checkConnection(): void {
        if (!this.connection) {
            throw Error("ORBADA internal database not initialized!");
        }
        if (!this.connection.isConnected()) {
            throw Error("ORBADA internal database closed!");
        }
    }

    async query(sql: string, values?: unknown[]): Promise<QueryResult> {
        this.checkConnection();
        return this.connection!.query(sql, values ?? []);
    }

    async execute(sql: string, values?: unknown[]): Promise<CommandResult> {
        this.checkConnection();
        return this.connection!.execute(sql, values ?? []);
    }

    isConnected(): boolean {
        this.checkConnection();
        return this.connection!.isConnected();
    }
}

let internal: InternalConnection = new Internal();

const lastVersion: Version<"major" | "minor" | "release" | "build" | "toString" | "parse"> = {
    toString: function (): string {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    },
    parse: function (version: string) {
        const values = version.split(".");
        if (values.length === 4) {
            this.major = new Number(values[0]).valueOf();
            this.minor = new Number(values[1]).valueOf();
            this.release = new Number(values[2]).valueOf();
            this.build = new Number(values[3]).valueOf();
        }
    }
}

export async function init(): Promise<void> {
    await import("../../../../plugins/sqlite/main/driver");
    await import("../../../../plugins/pg/main/driver");

    const driver = Driver.getDriver(consts.DBORG_DATABASE_DRIVER);
    if (!driver) {
        throw Error(`Can't find database driver (${consts.DBORG_DATABASE_DRIVER}) for ORBADA internal database!`);
    }

    internal.setConnection(await driver!.connect({
        "driver:database_location": path.join(dborgPath("data"), "dborg.sqlite")
    }, "internal"));

    if (!internal) {
        throw Error("Can't connect to DBorga internal database!");
    }

    await internal.execute("create table if not exists dborg (id varchar primary key, name varchar unique, value varchar)");
    const { rows } = await internal.query("select value from dborg where name = 'version'");
    if (rows.length) {
        lastVersion.parse(rows[0].value as string);
        const sql = "update dborg set value = ? where name = ?";
        await internal.execute(sql, [lastVersion.toString(), "last-version"]);
        await internal.execute(sql, [consts.version.toString(), "version"]);
        await internal.execute("update dborg set value = ? where name = ?", [DateTime.now().toSQL(), "last-start"]);
    }
    else {
        const sql = "insert into dborg values (?, ?, ?)";
        await internal.execute(sql, [uuidv7(), "version", consts.version.toString()]);
        await internal.execute(sql, [uuidv7(), "last-version", null]);
        await internal.execute(sql, [uuidv7(), "first-start", DateTime.now().toSQL()]);
        await internal.execute(sql, [uuidv7(), "last-start", null]);
    }

    if (Number(lastVersion.release ?? 0) <= 0) {
        await internal.execute(
            "create table schemas (\n" +
            "  sch_id varchar primary key, \n" +
            "  sch_created varchar, \n" +
            "  sch_updated varchar, \n" +
            "  sch_drv_unique_id varchar, \n" +
            "  sch_group varchar, \n" +
            "  sch_pattern varchar, \n" +
            "  sch_name varchar, \n" +
            "  sch_color varchar, \n" +
            "  sch_use_password varchar, \n" +
            "  sch_properties varchar, \n" +
            "  sch_last_selected varchar\n" +
            ")");
        await internal.execute(
            "create table drivers (\n" +
            "  drv_id varchar primary key, \n" +
            "  drv_unique_id varchar unique, \n" +
            "  drv_name varchar, \n" +
            "  drv_description varchar, \n" +
            "  drv_icon varchar, \n" +
            "  drv_version varchar\n" +
            ")"
        );
        await internal.execute("alter table schemas add column sch_db_version varchar");
        await internal.execute("alter table schemas add column sch_script varchar");
    }
    
    if (Number(lastVersion.release ?? 0) < 3) {
        await internal.execute("alter table schemas add column sch_order varchar");
    }
    
    const exclude: string[] = [];
    for (const driver of Driver.getDrivers()) {
        await internal.execute(
            "insert into drivers (drv_id, drv_unique_id, drv_name, drv_description, drv_icon, drv_version)\n" +
            "values (?, ?, ?, ?, ?, ?)\n" +
            "on conflict (drv_unique_id) do\n" +
            "update set\n" +
            "  drv_name = ?2,\n" +
            "  drv_description = ?3,\n" +
            "  drv_icon = ?4,\n" +
            "  drv_version = ?5\n" +
            "where drv_unique_id = ?6",
            [uuidv7(), driver.getUniqueId(), driver.getName(), driver.getDescription(), driver.getIcon() ?? null, driver.getVersion().toString()]
        );
        exclude.push(driver.getUniqueId());
    }
    await internal.execute(`delete from drivers where drv_unique_id not in (${exclude.map(value => `'${value}'`).join(", ")})`);
}

export default internal;
