import { styled, SxProps, Theme, useThemeProps } from "@mui/material";
import React from "react";
import { useTheme } from "@mui/material/styles";
import { Grid2, Box, Typography } from "@mui/material";

export type IconWrapperSize = "small" | "medium" | "large";

export interface IconWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    sx?: SxProps<Theme>;
    size?: IconWrapperSize
}

interface IconWrapperOwnProps extends IconWrapperProps {
}

export const IconWrapperRoot = styled('span', {
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

export const IconsList: React.FC = () => {
    const theme = useTheme(); // Pobierz motyw, aby uzyskać dostęp do ikon
    const icons = theme.icons as ThemeIcons; // Rzutowanie na ThemeIcons

    return (
        <Box sx={{ padding: 2, overflow: "auto", height: "400px" }}>
            <Grid2 container spacing={4}>
                {Object.entries(icons).map(([name, IconComponent]) => (
                    <Grid2 size={{ xs: 8, sm: 4, md: 2, lg: 1.5 }} key={name}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                padding: 8,
                                border: "1px solid",
                                borderColor: theme.palette.divider,
                                borderRadius: 2,
                                backgroundColor: theme.palette.background.paper,
                                boxShadow: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: 48,
                                    height: 48,
                                    marginBottom: 1,
                                    backgroundColor: theme.palette.action.hover,
                                    borderRadius: "50%",
                                    fontSize: 28,
                                }}
                            >
                                <IconComponent />
                            </Box>
                            <Typography variant="caption" noWrap>
                                {name}
                            </Typography>
                        </Box>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    );
};
