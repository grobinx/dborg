import { VersionBase } from "./version";


// for next releases
//export const dborgReleaseName: string = "Schrodinger's Sprout";
export const dborgReleaseName: string = "Louver Gate";
export const dborgDuration: string = "2024-2026";
export const dborgDate: string = "2026-04-25 21:30:53";
export const dborgPreRelease: string = "dev";

export const version: Pick<VersionBase, "major" | "minor" | "release" | "build" | "name" | "preRelease" | "toString"> = {
    major: 1,
    minor: 0,
    release: 9,
    build: 564,

    preRelease: dborgPreRelease,

    name: dborgReleaseName,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}${this.preRelease ? `-${this.preRelease}` : ""}`;
    }
}
export const DBORG_DATABASE_DRIVER = "sqlite3";
