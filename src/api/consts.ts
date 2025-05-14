import Version from "./version";

export const version: Version = {
    major: 1,
    minor: 0,
    release: 0,
    build: 6,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

export const DBORG_DATABASE_DRIVER = "sqlite3";
