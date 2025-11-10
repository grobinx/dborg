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
}

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
