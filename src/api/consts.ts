import Version from "./version";
import dborgPackage from '../../package.json';

export const version: Version = {
    major: 1,
    minor: 0,
    release: 5,
    build: 380,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

export const dborgReleaseName: string = "Schrodinger's Sprout";
export const dborgDuration: string = "2024-2025";
export const dborgDate: string = "2025-10-19 15:41:23";

export const DBORG_DATABASE_DRIVER = "sqlite3";
