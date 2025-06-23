import Version from "./version";
import dborgPackage from '../../package.json';

export const version: Version = {
    major: 1,
    minor: 0,
    release: 0,
    build: 23,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

export const dborgDuration: string = "2024-2025";

export const DBORG_DATABASE_DRIVER = "sqlite3";
