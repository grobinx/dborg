import path from "node:path";
import * as consts from "../../../api/consts";
import { Connection, Driver } from "../../api/db";
import { DBORG_DATA_PATH, dataPath as dborgPath } from '../../api/dborg-path'
import Version from "../../../api/version";
import { uuidv7 } from "uuidv7";
import { CommandResult, QueryResult } from "../../../api/db";
import { DateTime } from "luxon";
import fs from "node:fs/promises";
import { DborgRecord, DriverRecord } from "src/api/entities";
import dborgPackage from '../../../../package.json';

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

    try {
        await updateDborg();
    } catch (e) {
        console.error("Storing dborg info failed:", e);
    }

    try {
        await updateDrivers();
    } catch (e) {
        console.error("Storing drivers failed:", e);
    }
}

async function updateDrivers() {
    const filePath = path.join(dborgPath(DBORG_DATA_PATH), "drivers.json");
    let drivers: DriverRecord[] | undefined = undefined;

    try {
        const driversData = await fs.readFile(filePath, { encoding: "utf-8" });
        if (driversData) {
            drivers = JSON.parse(driversData) as DriverRecord[];
        }
    } catch (e) {
        // ignore
    }
    drivers = Driver.getDrivers().map(driver => {
        const existing = drivers?.find(d => d.drv_unique_id === driver.getUniqueId());
        return {
            drv_id: existing?.drv_id ?? uuidv7(),
            drv_unique_id: driver.getUniqueId(),
            drv_name: driver.getName(),
            drv_description: driver.getDescription(),
            drv_icon: driver.getIcon(),
            drv_version: driver.getVersion().toString()
        } as DriverRecord;
    });
    await fs.writeFile(filePath, JSON.stringify(drivers, null, 2), { encoding: "utf-8" });
}

async function updateDborg() {
    const filePath = path.join(dborgPath(DBORG_DATA_PATH), "dborg.json");
    let dborg: DborgRecord | undefined = undefined;

    try {
        const dborgData = await fs.readFile(filePath, { encoding: "utf-8" });
        if (dborgData) {
            dborg = JSON.parse(dborgData) as DborgRecord;
        }
    } catch (e) {
        // ignore
    }
    
    dborg = {
        id: dborg?.id ?? uuidv7(),
        version: consts.version.toString(),
        lastVersion: dborg?.version ?? null,
        firstStart: dborg?.firstStart ?? DateTime.now().toSQL(),
        lastStart: DateTime.now().toSQL(),
        release: consts.dborgReleaseName,
        author: dborgPackage.author,
        homepage: dborgPackage.homepage,
        license: dborgPackage.license,
        date: consts.dborgDate,
        duration: consts.dborgDuration,
        platform: process.platform,
        arch: process.arch,
        environment: {
            node: process.versions.node,
            v8: process.versions.v8,
            uv: process.versions.uv,
            zlib: process.versions.zlib,
            openssl: process.versions.openssl,
            electron: process.versions.electron
        }
    } as DborgRecord;

    await fs.writeFile(filePath, JSON.stringify(dborg, null, 2), { encoding: "utf-8" });
}

export default internal;
