import Version from "./version";
import dborgPackage from '../../package.json';

export const version: Version = {
    major: 1,
    minor: 0,
    release: 0,
    build: 40,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

export const dborgReleaseName: string = "Quantum Banana";
export const dborgDuration: string = "2024-2025";
export const dborgDate: string = "2025-06-25 23:39:16";

export const DBORG_DATABASE_DRIVER = "sqlite3";
