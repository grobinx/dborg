import Version from "./version";
import dborgPackage from '../../package.json';

export const version: Version = {
    major: 1,
    minor: 0,
    release: 1,
    build: 252,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

export const dborgReleaseName: string = "Quantum Banana";
export const dborgDuration: string = "2024-2025";
export const dborgDate: string = "2025-08-07 21:23:33";

export const DBORG_DATABASE_DRIVER = "sqlite3";
