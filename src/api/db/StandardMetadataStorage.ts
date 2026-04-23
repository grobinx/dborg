import path from "path";
import { Connection } from "../../../src/main/api/db";
import { ProfileRecord } from "../entities";
import { DatabaseMetadata, IMetadataStorage, Metadata, METADATA_VERSION, SchemaMetadata } from "./Metadata";
import { dataPath, DBORG_DATA_PATH } from "../../../src/main/api/dborg-path";
import { createReadStream, createWriteStream } from "fs";
import zlib from 'zlib';
import * as readline from 'readline';
import fs from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const METADATA_ARCHIVE_FORMAT = 'dborg-metadata-ndjson-v1';
const NOT_ARCHIVE_ERROR = '__NOT_DBORG_METADATA_ARCHIVE__';

export class StandardMetadataStorage implements IMetadataStorage {

    private getFilePath(connection: Connection): string {
        const profile = connection.getUserData("profile") as ProfileRecord;
        const fileName = `${profile.sch_id}.json`;
        return path.join(dataPath(DBORG_DATA_PATH), "metadata", fileName);
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }

    async storeMetadata(metadata: Metadata, connection: Connection): Promise<void> {
        const filePath = this.getFilePath(connection);
        await this.storeMetadataArchive(metadata, filePath);
    }

    private async storeMetadataArchive(metadata: Metadata, filePath: string): Promise<void> {
        await pipeline(
            Readable.from(this.metadataArchiveLines(metadata)),
            zlib.createGzip(),
            createWriteStream(filePath)
        );
    }

    private async *metadataArchiveLines(metadata: Metadata): AsyncGenerator<string> {
        yield `${JSON.stringify({
            kind: 'manifest',
            format: METADATA_ARCHIVE_FORMAT,
            version: METADATA_VERSION,
            date: metadata.date ?? Date.now(),
            collected: metadata.collected
        })}\n`;

        for (const [databaseName, database] of Object.entries(metadata.databases ?? {})) {
            const databaseData: Record<string, unknown> = { ...database };
            delete databaseData.schemas;

            yield `${JSON.stringify({
                kind: 'database',
                path: `databases/${encodeURIComponent(databaseName)}.json`,
                database: databaseName,
                data: databaseData
            })}\n`;

            for (const [schemaName, schema] of Object.entries(database.schemas ?? {})) {
                yield `${JSON.stringify({
                    kind: 'schema',
                    path: `schemas/${encodeURIComponent(databaseName)}/${encodeURIComponent(schemaName)}.json`,
                    database: databaseName,
                    schema: schemaName,
                    data: schema
                })}\n`;
            }
        }
    }

    async restoreMetadata(metadata: Metadata, connection: Connection): Promise<Metadata | undefined> {
        const filePath = this.getFilePath(connection);
        if (await fs.access(filePath).then(() => true).catch(() => false)) {
            return this.restoreMetadataArchive(metadata, filePath);
        }
        return undefined;
    }

    private async restoreMetadataArchive(metadata: Metadata, filePath: string): Promise<Metadata | undefined> {
        metadata.status = "collecting";

        const input = createReadStream(filePath).pipe(zlib.createGunzip());
        const rl = readline.createInterface({
            input,
            crlfDelay: Infinity
        });

        let manifestLoaded = false;
        let lineNumber = 0;
        let bytesProcessed = 0;
        const CHUNK_SIZE = 256 * 1024; // 256KB
        let nextPauseAt = CHUNK_SIZE;
        const databases: Record<string, DatabaseMetadata> = {};

        for await (const rawLine of rl) {
            const line = rawLine.trim();
            if (!line) {
                continue;
            }

            lineNumber += 1;
            bytesProcessed += Buffer.byteLength(rawLine, 'utf8');

            // Co 256KB robić przerwę 100ms aby oddać kontrolę renderowi
            if (bytesProcessed >= nextPauseAt) {
                await new Promise(resolve => setTimeout(resolve, 100));
                nextPauseAt = bytesProcessed + CHUNK_SIZE;
            }

            let parsedLine: unknown;
            try {
                parsedLine = JSON.parse(line);
            } catch {
                if (!manifestLoaded && lineNumber === 1) {
                    throw new Error(NOT_ARCHIVE_ERROR);
                }
                throw new Error(`Corrupted metadata archive at line ${lineNumber}`);
            }

            if (!this.isObject(parsedLine)) {
                throw new Error(`Corrupted metadata archive at line ${lineNumber}`);
            }

            const kind = typeof parsedLine.kind === 'string' ? parsedLine.kind : '';

            if (!manifestLoaded) {
                const format = typeof parsedLine.format === 'string' ? parsedLine.format : '';
                const archiveVersion = typeof parsedLine.version === 'number' ? parsedLine.version : undefined;
                const date = typeof parsedLine.date === 'number' ? parsedLine.date : Date.now();
                const collected = typeof parsedLine.collected === 'object' && parsedLine.collected !== null ? parsedLine.collected : undefined;

                if (kind !== 'manifest' || format !== METADATA_ARCHIVE_FORMAT) {
                    throw new Error(NOT_ARCHIVE_ERROR);
                }

                if (archiveVersion !== METADATA_VERSION) {
                    throw new Error(
                        `Incompatible metadata version: ${archiveVersion} (expected ${METADATA_VERSION})`
                    );
                }

                manifestLoaded = true;
                metadata.version = archiveVersion;
                metadata.date = date;
                metadata.collected = collected;
                continue;
            }

            if (kind === 'database') {
                const databaseName = typeof parsedLine.database === 'string' ? parsedLine.database : '';
                const data = parsedLine.data;

                if (!databaseName || !this.isObject(data)) {
                    throw new Error(`Corrupted metadata archive at line ${lineNumber}`);
                }

                const existingSchemas = databases?.[databaseName]?.schemas ?? {};
                databases[databaseName] = {
                    ...(data as Omit<DatabaseMetadata, 'schemas'>),
                    schemas: existingSchemas
                } as DatabaseMetadata;

                continue;
            }

            if (kind === 'schema') {
                const databaseName = typeof parsedLine.database === 'string' ? parsedLine.database : '';
                const schemaName = typeof parsedLine.schema === 'string' ? parsedLine.schema : '';
                const data = parsedLine.data;

                if (!databaseName || !schemaName || !this.isObject(data)) {
                    throw new Error(`Corrupted metadata archive at line ${lineNumber}`);
                }

                const database = databases?.[databaseName];
                if (!database) {
                    throw new Error(
                        `Corrupted metadata archive. Missing database entry for schema ${databaseName}.${schemaName}`
                    );
                }

                database.schemas[schemaName] = data as any as SchemaMetadata;
                continue;
            }

            throw new Error(`Corrupted metadata archive at line ${lineNumber}`);
        }

        if (!manifestLoaded) {
            throw new Error(NOT_ARCHIVE_ERROR);
        }

        metadata.databases = databases;
        metadata.status = "ready";

        return metadata;
    }
}