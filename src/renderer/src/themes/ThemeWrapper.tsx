import React from "react";
import { ThemeProvider, CssBaseline, createTheme, Theme } from "@mui/material";
import { useSetting } from "../contexts/SettingsContext";
import defaultDarkPalette from '../themes/palettes/defaultDark';
import defaultLightPalette from '../themes/palettes/defaultLight';
import defaultLayout from '../themes/layouts/defaultLayout';
import defaultIcons from '../themes/icons/defaultIcons';
import rootLayout from '../themes/layouts/root';
import { ThemeIcons } from "./icons";

export let icons: ThemeIcons | undefined = undefined;

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [uiTheme] = useSetting("ui", "theme");
    const [fontSize] = useSetting<number>("ui", "fontSize", 14);
    const [fontFamily] = useSetting<string>("ui", "fontFamily");
    const [monospaceFontFamily] = useSetting<string>("ui", "monospaceFontFamily");

    const prefersDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const createThemes = React.useCallback(() => {
        const root = rootLayout(
            fontSize, 
            fontFamily, 
            monospaceFontFamily, 
            (uiTheme === "system" ? (prefersDarkMode ? "dark" : "light") : uiTheme) as "light" | "dark"
        );

        const themeLight = createTheme(
            {
                ...root,
                palette: defaultLightPalette,
            },
            defaultLayout(defaultLightPalette, root),
            defaultIcons(defaultLightPalette)
        );

        const themeDark = createTheme(
            {
                ...root,
                palette: defaultDarkPalette,
            },
            defaultLayout(defaultDarkPalette, root),
            defaultIcons(defaultDarkPalette)
        );

        return { themeLight, themeDark };
    }, [fontSize, fontFamily, monospaceFontFamily]);

    const selectedTheme = () => {
        const { themeLight, themeDark } = createThemes();
        const theme =
            uiTheme === "system"
                ? prefersDarkMode
                    ? themeDark
                    : themeLight
                : uiTheme === "light"
                    ? themeLight
                    : themeDark;
        icons = theme.icons;
        return theme;
    }

    const [theme, setTheme] = React.useState<Theme>(() => selectedTheme());

    React.useEffect(() => {
        setTheme(selectedTheme());
    }, [uiTheme, prefersDarkMode, createThemes]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};

export default ThemeWrapper;