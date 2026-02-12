import Version from "./version";
import dborgPackage from '../../package.json';

export const version: Version = {
    major: 1,
    minor: 0,
    release: 7,
    build: 426,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

// for next releases
//export const dborgReleaseName: string = "Schrodinger's Sprout";
export const dborgReleaseName: string = "Louver Gate";
export const dborgDuration: string = "2024-2026";
export const dborgDate: string = "2026-02-12 07:54:20";

export const DBORG_DATABASE_DRIVER = "sqlite3";
