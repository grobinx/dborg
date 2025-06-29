import { styled, SxProps, Theme, useThemeProps } from "@mui/material";
import * as React from 'react';

export type IconWrapperSize = "small" | "medium" | "large";

export interface IconWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    sx?: SxProps<Theme>;
    size?: IconWrapperSize
}

interface IconWrapperOwnProps extends IconWrapperProps {
}

export const IconWrapperRoot = styled('div', {
    name: 'IconWrapper', // The component name
    slot: 'root', // The slot name
})(() => ({
    display: 'flex',
    color: 'inherit',
    position: 'relative',
    width: "1em", // Ustawienie szerokości
    height: "1em", // Ustawienie wysokości
    alignItems: "center",
}));

export function IconWrapper(props: IconWrapperOwnProps): React.ReactElement<IconWrapperOwnProps> {
    const { className, ...other } = useThemeProps({ name: 'IconWrapper', props });
    return (<IconWrapperRoot {...other} className={(className ?? "") + " IconWrapper-root"}>{props.children}</IconWrapperRoot>);
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
    SelectDatabaseSchema: IconWrapperFC;
    RefreshMetadata: IconWrapperFC;
    Not: IconWrapperFC;
    Filter: IconWrapperFC;
}

export const resolveIcon = (theme: Theme, icon?: React.ReactNode | (() => React.ReactNode)) => {
    if (typeof icon === 'function') {
        icon = icon();
    }
    if (typeof icon === 'string') {
        // Jeśli `icon` jest ciągiem znaków, sprawdź w `theme.icons`
        if (theme.icons[icon]) {
            return React.createElement(theme.icons[icon]);
        } else {
            // Jeśli nie ma w `theme.icons`, wyświetl jako obrazek
            return <img src={icon} alt={icon} style={{ width: 24, height: 24 }} />;
        }
    } else {
        return icon;
    }
};
