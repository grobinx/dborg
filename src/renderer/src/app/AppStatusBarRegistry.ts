export type StatusButtonComp = React.FC;

export const appStatusBarButtons: {
    static: Map<string, StatusButtonComp>;
    hidden: Map<string, StatusButtonComp>;
} = {
    static: new Map(),
    hidden: new Map(),
};
