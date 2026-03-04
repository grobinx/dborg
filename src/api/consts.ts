import Version from "./version";
import dborgPackage from '../../package.json';

export const version: Version = {
    major: 1,
    minor: 0,
    release: 7,
    build: 447,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

// for next releases
//export const dborgReleaseName: string = "Schrodinger's Sprout";
export const dborgReleaseName: string = "Louver Gate";
export const dborgDuration: string = "2024-2026";
export const dborgDate: string = "2026-03-04 07:58:06";

export const DBORG_DATABASE_DRIVER = "sqlite3";
