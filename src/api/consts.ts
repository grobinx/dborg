import { VersionBase } from "./version";
import dborgPackage from '../../package.json';


// for next releases
//export const dborgReleaseName: string = "Schrodinger's Sprout";
export const dborgReleaseName: string = "Louver Gate";
export const dborgDuration: string = "2024-2026";
export const dborgDate: string = "2026-03-10 09:15:31";
export const dborgPreRelease: string = "dev";

export const version: Pick<VersionBase, "major" | "minor" | "release" | "build" | "name" | "preRelease" | "toString"> = {
    major: 1,
    minor: 0,
    release: 7,
    build: 459,

    preRelease: dborgPreRelease,

    name: dborgReleaseName,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}${this.preRelease ? `-${this.preRelease}` : ""}`;
    }
}
export const DBORG_DATABASE_DRIVER = "sqlite3";
