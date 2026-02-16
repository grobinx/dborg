import { styled, SxProps, Theme, useThemeProps } from "@mui/material";
import React from "react";
import { ThemeColor } from "@renderer/types/colors";

export type IconWrapperSize = "small" | "medium" | "large";

export interface IconWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    sx?: SxProps<Theme>;
    size?: IconWrapperSize
}

export interface IconWrapperOwnProps extends IconWrapperProps {
    color?: ThemeColor | "default";
}

const StyledIconWrapper = styled('span', {
    name: 'IconWrapper',
    slot: 'root',
    shouldForwardProp: (prop) => prop !== 'color',
})<{ color?: ThemeColor | "default" }>(({ theme, color }) => ({
    display: 'flex',
    color: (color && color !== "default") ? theme.palette[color].main : 'inherit',
    position: 'relative',
    width: "1em", // Ustawienie szerokości
    height: "1em", // Ustawienie wysokości
    alignItems: "center",
    //fontSize: "1.2em",
}));

export function IconWrapper(props: IconWrapperOwnProps): React.ReactElement<IconWrapperOwnProps> {
    const { className, color, sx, style } = useThemeProps({ name: 'IconWrapper', props });
    return (
        <StyledIconWrapper color={color} className={(className ?? "") + " IconWrapper-root"} sx={sx} style={style}>
            {props.children}
        </StyledIconWrapper>
    );
}

interface OverlayIconProps {
    x?: number | string;
    y?: number | string;
    color?: string;
    shadow?: string; // Nowa właściwość dla cieniowania
    size?: number | string; // Dodano rozmiar
    children: React.ReactNode;
}

export const OverlayIcon: React.FC<OverlayIconProps> = ({
    x = 0,
    y = 0,
    color = 'inherit',
    shadow = 'none', // Domyślna wartość dla cieniowania
    size = '1em', // Domyślny rozmiar
    children,
}) => {
    const iconStyle: React.CSSProperties = {
        position: 'absolute',
        left: x,
        top: y,
        color,
        filter: shadow !== 'none' ? `drop-shadow(${shadow})` : 'none', // Dodano obsługę cieniowania
        fontSize: size, // Ustawienie rozmiaru
        display: "flex",
    };

    return (
        <div style={iconStyle}>
            {children}
        </div>
    );
};


export type IconWrapperFC = (props: IconWrapperOwnProps) => React.ReactElement<IconWrapperOwnProps>;

export interface ThemeIcons {
    MaximizeWindow: IconWrapperFC;
    MinimizeWindow: IconWrapperFC;
    CloseWindow: IconWrapperFC;
    RestoreWindow: IconWrapperFC;
    ZoomIn: IconWrapperFC;
    Error: IconWrapperFC;
    Warning: IconWrapperFC;
    Hint: IconWrapperFC;
    Info: IconWrapperFC;
    Log: IconWrapperFC;
    Success: IconWrapperFC;
    Notifications: IconWrapperFC;
    NewConnection: IconWrapperFC;
    ConnectionList: IconWrapperFC;
    Connections: IconWrapperFC;
    EditConnectionSchema: IconWrapperFC;
    CloneConnectionSchema: IconWrapperFC;
    Settings: IconWrapperFC;
    OpenFile: IconWrapperFC;
    Visibility: IconWrapperFC;
    VisibilityOff: IconWrapperFC;
    AddPropertyTextField: IconWrapperFC;
    SelectGroup: IconWrapperFC;
    Plugins: IconWrapperFC;
    Cupcake: IconWrapperFC;
    Drink: IconWrapperFC;
    Properties: IconWrapperFC;
    Connected: IconWrapperFC;
    ConnectedGlow: IconWrapperFC;
    Disconnected: IconWrapperFC;
    Delete: IconWrapperFC;
    GroupList: IconWrapperFC;
    Close: IconWrapperFC;
    ExpandLess: IconWrapperFC;
    ExpandMore: IconWrapperFC;
    ConnectionTest: IconWrapperFC;
    Loading: IconWrapperFC;
    Refresh: IconWrapperFC;
    SqlEditor: IconWrapperFC;
    JsonEditor: IconWrapperFC;
    HtmlEditor: IconWrapperFC;
    CssEditor: IconWrapperFC;
    JsEditor: IconWrapperFC;
    XmlEditor: IconWrapperFC;
    MarkdownEditor: IconWrapperFC;
    DatabaseTables: IconWrapperFC;
    DatabaseViews: IconWrapperFC;
    DataGrid: IconWrapperFC;
    AdjustWidth: IconWrapperFC;
    Reset: IconWrapperFC;
    Clipboard: IconWrapperFC;
    Strict: IconWrapperFC;
    WholeWord: IconWrapperFC;
    CaseSensitive: IconWrapperFC;
    AddTab: IconWrapperFC;
    ExcludeText: IconWrapperFC;
    Search: IconWrapperFC;
    ResetSearch: IconWrapperFC;
    SelectDatabaseSchema: IconWrapperFC;
    RefreshMetadata: IconWrapperFC;
    Not: IconWrapperFC;
    Filter: IconWrapperFC;
    Equal: IconWrapperFC;
    GreaterThan: IconWrapperFC;
    LessThan: IconWrapperFC;
    SuchLike: IconWrapperFC;
    Null: IconWrapperFC;
    ElementOf: IconWrapperFC;
    QueryHistory: IconWrapperFC;
    Check: IconWrapperFC;
    Clock: IconWrapperFC;
    EditableEditor: IconWrapperFC;
    ReadOnlyEditor: IconWrapperFC;
    MoreHoriz: IconWrapperFC;
    MoreVert: IconWrapperFC;
    Developer: IconWrapperFC;
    GeneratePassword: IconWrapperFC;
    Digit: IconWrapperFC;
    SpecialChar: IconWrapperFC;
    NoSpaces: IconWrapperFC;
    UpperLetter: IconWrapperFC;
    LowerLetter: IconWrapperFC;
    TextField: IconWrapperFC;
    NumberField: IconWrapperFC;
    PasswordField: IconWrapperFC;
    EmailField: IconWrapperFC;
    CheckBoxBlank: IconWrapperFC;
    CheckBoxChecked: IconWrapperFC;
    CheckBoxIndeterminate: IconWrapperFC;
    Add: IconWrapperFC;
    ChevronRight: IconWrapperFC;
    ChevronLeft: IconWrapperFC;
    Sort: IconWrapperFC;
    DragHandle: IconWrapperFC;
    DragIndicator: IconWrapperFC;
    AutoRefresh: IconWrapperFC;
    Pause: IconWrapperFC;
    Stop: IconWrapperFC;
    Clear: IconWrapperFC;
    Start: IconWrapperFC;
    Resume: IconWrapperFC;
    Comment: IconWrapperFC;
    CommentRemove: IconWrapperFC;
    DataType: IconWrapperFC;
    DefaultValue: IconWrapperFC;
    Rename: IconWrapperFC;
    Statistics: IconWrapperFC;
    Compress: IconWrapperFC;
    Sequence: IconWrapperFC;
    File: IconWrapperFC;
    Folder: IconWrapperFC;
    Link: IconWrapperFC;
    DatabaseSettings: IconWrapperFC;
    Copy: IconWrapperFC;
    Paste: IconWrapperFC;
    Cut: IconWrapperFC;
    Undo: IconWrapperFC;
    Redo: IconWrapperFC;
    Sessions: IconWrapperFC;
    Storage: IconWrapperFC;
    Extensions: IconWrapperFC;
    Pin: IconWrapperFC;
    Pinned: IconWrapperFC;
    Tools: IconWrapperFC;
    Users: IconWrapperFC;
    Flow: IconWrapperFC;
    UserRemove: IconWrapperFC;
    DropCascade: IconWrapperFC;
    DropRestrict: IconWrapperFC;
    MoveObject: IconWrapperFC;
    ReassignUser: IconWrapperFC;
    RevokePrivileges: IconWrapperFC;
    RevokeAdminOption: IconWrapperFC;
    Reload: IconWrapperFC;
    ReloadAll: IconWrapperFC;
    ReloadStop: IconWrapperFC;
    CancleQuery: IconWrapperFC;
    KillSession: IconWrapperFC;
    Vacuum: IconWrapperFC;
    Analyze: IconWrapperFC;
    Queue: IconWrapperFC;
    Reindex: IconWrapperFC;
    Cluster: IconWrapperFC;
    AddRow: IconWrapperFC;
    RemoveRow: IconWrapperFC;
    EditRow: IconWrapperFC;
    Formatted: IconWrapperFC;
    Hexagon: IconWrapperFC;
    Image: IconWrapperFC;
    Run: IconWrapperFC;
}

export type ThemeIconName = keyof ThemeIcons;

export const resolveIcon = (theme: Theme, icon?: React.ReactNode | (() => React.ReactNode), alt?: string) => {
    if (typeof icon === 'function') {
        return icon();
    }
    if (typeof icon === 'string') {
        if (theme.icons[icon]) {
            return React.createElement(theme.icons[icon]);
        } else {
            return <img src={icon} alt={alt} style={{ width: 24, height: 24 }} />;
        }
    }
    return icon;
};

export const iconAliases: Record<ThemeIconName, string[]> = {
    MaximizeWindow: ["maximize", "fullscreen", "expand", "enlarge", "window", "max"],
    MinimizeWindow: ["minimize", "collapse", "hide", "window", "min"],
    CloseWindow: ["close", "window", "exit", "dismiss"],
    RestoreWindow: ["restore", "restore", "window", "unmaximize", "normal", "size"],
    ZoomIn: ["zoom", "in", "magnify", "increase", "scale", "up"],
    Error: ["error", "failed", "failure", "danger", "critical"],
    Warning: ["warning", "caution", "alert"],
    Hint: ["hint", "tip", "suggestion", "advice"],
    Info: ["info", "information", "details"],
    Log: ["log", "logs", "journal", "output"],
    Success: ["success", "done", "completed", "ok"],
    Notifications: ["notifications", "alerts", "messages", "updates"],
    NewConnection: ["new", "connection", "add", "create", "connect"],
    ConnectionList: ["connection", "list", "connections", "servers", "hosts"],
    Connections: ["connections", "database", "endpoints"],
    EditConnectionSchema: ["edit", "connection", "schema", "settings", "modify"],
    CloneConnectionSchema: ["clone", "connection", "duplicate", "copy"],
    ConnectionTest: ["test", "connection", "check", "validate"],
    Settings: ["settings", "preferences", "configuration", "options"],
    OpenFile: ["open", "file", "browse", "load"],
    Visibility: ["visible", "show", "eye", "view"],
    VisibilityOff: ["hidden", "hide", "invisible", "conceal"],
    AddPropertyTextField: ["add", "property", "new", "text field", "property field"],
    SelectGroup: ["select", "group", "choose", "group picker"],
    Plugins: ["plugins", "extensions", "addons"],
    Cupcake: ["cupcake", "fun", "easter", "egg"],
    Drink: ["drink", "coffee", "beverage", "break"],
    Properties: ["properties", "attributes", "details", "metadata"],
    Connected: ["connected", "online", "linked", "active", "connection"],
    ConnectedGlow: ["connected", "glow", "online", "active", "status", "on"],
    Disconnected: ["disconnected", "offline", "not", "connected"],
    Delete: ["delete", "remove", "trash", "erase"],
    GroupList: ["group", "list", "groups", "categories"],
    Close: ["close", "dismiss", "cancel", "x"],
    ExpandLess: ["collapse", "expand", "less", "up", "fold"],
    ExpandMore: ["expand", "more", "down", "unfold"],
    Loading: ["loading", "busy", "in", "progress", "spinner"],
    Refresh: ["refresh", "reload", "update", "sync"],
    SqlEditor: ["sql", "editor", "query", "database"],
    JsonEditor: ["json", "editor", "json", "structured", "data"],
    HtmlEditor: ["html", "markup", "editor"],
    CssEditor: ["css", "style", "editor"],
    JsEditor: ["javascript", "editor", "javascript", "js"],
    XmlEditor: ["xml", "markup", "editor"],
    MarkdownEditor: ["markdown", "editor", "md"],
    DatabaseTables: ["database", "tables", "table", "list"],
    DatabaseViews: ["database", "views", "view", "list"],
    DataGrid: ["data", "grid", "table", "view", "rows", "columns"],
    AdjustWidth: ["adjust", "width", "auto", "fit", "resize", "columns"],
    Reset: ["reset", "restore", "defaults", "clear", "settings", "revert"],
    Clipboard: ["clipboard", "copy", "buffer", "pasteboard"],
    Strict: ["strict", "exact", "precise", "enforce"],
    WholeWord: ["whole", "word", "word", "boundary"],
    CaseSensitive: ["case", "sensitive", "match", "case", "letter", "case"],
    AddTab: ["add", "tab", "new", "open"],
    ExcludeText: ["exclude", "text", "negate", "omit", "filter", "out"],
    Search: ["search", "find", "lookup", "query"],
    ResetSearch: ["reset", "search", "clear", "search", "remove", "filter"],
    SelectDatabaseSchema: ["select", "database", "schema", "choose", "schema"],
    RefreshMetadata: ["refresh", "metadata", "reload", "metadata", "update", "schema"],
    Not: ["not", "negation", "exclude", "invert"],
    Filter: ["filter", "where", "criteria", "condition"],
    Equal: ["equal", "equals", "is", "="],
    GreaterThan: ["greater", "than", "more", "than", ">"],
    LessThan: ["less", "than", "smaller", "than", "<"],
    SuchLike: ["like", "contains", "pattern", "wildcard", "match"],
    Null: ["null", "empty", "no", "value", "missing"],
    ElementOf: ["element", "of", "in", "list", "member", "of", "belongs", "to"],
    QueryHistory: ["query", "history", "recent", "queries", "past", "queries"],
    Check: ["check", "tick", "confirm", "ok"],
    Clock: ["clock", "time", "schedule", "history", "time"],
    EditableEditor: ["editable", "edit", "mode", "write", "mode"],
    ReadOnlyEditor: ["read", "only", "locked", "view", "only"],
    MoreHoriz: ["more", "horizontal", "ellipsis", "more", "options", "menu"],
    MoreVert: ["more", "vertical", "kebab", "menu", "more", "options", "menu"],
    Developer: ["developer", "dev tools", "engineering", "code"],
    GeneratePassword: ["generate", "password", "password", "generator", "random", "password"],
    Digit: ["digit", "number", "numeric"],
    SpecialChar: ["special", "character", "symbol", "punctuation"],
    NoSpaces: ["no", "without", "trim", "spaces"],
    UpperLetter: ["uppercase", "capital", "upper", "letter"],
    LowerLetter: ["lowercase", "small", "lower", "letter"],
    TextField: ["text", "field", "text", "input", "string", "field"],
    NumberField: ["number", "field", "numeric", "field", "integer", "field"],
    PasswordField: ["password", "field", "secret", "field", "masked", "input"],
    EmailField: ["email", "field", "email", "input", "mail", "field"],
    CheckBoxBlank: ["checkbox", "blank", "unchecked", "empty", "checkbox"],
    CheckBoxChecked: ["checkbox", "checked", "selected"],
    CheckBoxIndeterminate: ["checkbox", "indeterminate", "partial", "selection", "mixed", "state"],
    Add: ["add", "create", "new", "plus"],
    ChevronRight: ["chevron", "next", "forward", "right"],
    ChevronLeft: ["chevron", "previous", "back", "left"],
    Sort: ["sort", "order", "arrange", "sort by"],
    DragHandle: ["drag", "handle", "grab", "move", "reorder"],
    DragIndicator: ["drag", "indicator", "move", "reorder"],
    AutoRefresh: ["auto", "refresh", "live", "update", "auto", "reload", "polling"],
    Pause: ["pause", "hold", "suspend"],
    Stop: ["stop", "halt", "terminate"],
    Clear: ["clear", "empty", "reset", "content", "remove", "all"],
    Start: ["start", "begin", "run"],
    Resume: ["resume", "continue", "restart", "process"],
    Comment: ["comment", "annotate", "note", "comment", "out"],
    CommentRemove: ["remove", "comment", "uncomment", "clear", "comment"],
    DataType: ["data", "type", "type", "column", "type", "datatype"],
    DefaultValue: ["value", "default", "initial"],
    Rename: ["rename", "change", "name", "edit"],
    Statistics: ["statistics", "stats", "metrics", "analysis"],
    Compress: ["compress", "shrink", "compact", "minify"],
    Sequence: ["sequence", "increment", "serial", "counter"],
    File: ["file", "document", "resource"],
    Folder: ["folder", "directory", "container"],
    Link: ["link", "reference", "shortcut", "url"],
    DatabaseSettings: ["database", "settings", "db", "options", "configuration"],
    Copy: ["copy", "duplicate", "clone", "selection"],
    Paste: ["paste", "insert", "from", "clipboard"],
    Cut: ["cut", "move", "to", "clipboard", "remove", "and", "copy"],
    Undo: ["undo", "revert", "back"],
    Redo: ["redo", "repeat", "forward"],
    Sessions: ["sessions", "connections", "active", "users"],
    Storage: ["storage", "disk", "space", "data"],
    Extensions: ["extensions", "plugins", "addons"],
    Pin: ["pin", "attach", "keep", "visible"],
    Pinned: ["pinned", "fixed", "attached"],
    Tools: ["tools", "utilities", "toolbox"],
    Users: ["users", "accounts", "roles"],
    Flow: ["flow", "workflow", "pipeline", "process"],
    UserRemove: ["remove", "user", "delete", "drop"],
    DropCascade: ["drop", "cascade", "delete", "with", "dependencies"],
    DropRestrict: ["drop", "restrict", "prevent", "dependency"],
    MoveObject: ["move", "object", "transfer", "relocate"],
    ReassignUser: ["reassign", "user", "change", "owner", "transfer", "ownership"],
    RevokePrivileges: ["revoke", "privileges", "remove", "permissions", "grants"],
    RevokeAdminOption: ["revoke", "admin", "option", "remove", "right"],
    Reload: ["reload", "refresh", "reopen"],
    ReloadAll: ["reload", "all", "refresh", "reload", "everything"],
    ReloadStop: ["stop", "reload", "cancel", "reload", "halt", "refresh"],
    KillSession: ["kill", "session", "terminate", "session", "end", "session"],
    Vacuum: ["vacuum", "cleanup", "garbage", "collect", "maintenance"],
    Analyze: ["analyze", "update", "statistics", "query", "planner", "stats"],
    Queue: ["queue", "pending", "jobs", "task", "queue"],
    Reindex: ["reindex", "rebuild", "index", "maintenance"],
    Cluster: ["cluster", "recluster", "cluster", "table"],
    AddRow: ["add", "row", "insert", "new"],
    RemoveRow: ["remove", "row", "delete", "drop"],
    EditRow: ["edit", "row", "update", "modify"],
    Formatted: ["formatted", "pretty", "print", "beautified", "styled"],
    Hexagon: ["hexagon", "shape", "polygon"],
    Image: ["image", "picture", "photo", "graphic"],
    Run: ["run", "execute", "start", "play"],
    CancleQuery: ["cancel", "query", "stop", "abort"],
};
