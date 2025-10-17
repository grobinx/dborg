import React from "react";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useSetting } from "../contexts/SettingsContext";
import defaultDarkPalette from '../themes/palettes/defaultDark';
import defaultLightPalette from '../themes/palettes/defaultLight';
import defaultLayout from '../themes/layouts/defaultLayout';
import defaultIcons from '../themes/icons/defaultIcons';
import rootLayout from '../themes/layouts/root';

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [uiTheme] = useSetting("ui", "theme");
    const [fontSize] = useSetting<number>("ui", "fontSize", 14);
    const [fontFamily] = useSetting<string>("ui", "fontFamily");
    const [monospaceFontFamily] = useSetting<string>("ui", "monospaceFontFamily");

    const prefersDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const createThemes = React.useCallback(() => {
        const root = rootLayout(fontSize, fontFamily, monospaceFontFamily);

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

    const [theme, setTheme] = React.useState(() => {
        const { themeLight, themeDark } = createThemes();
        return uiTheme === "system"
            ? prefersDarkMode
                ? themeDark
                : themeLight
            : uiTheme === "light"
                ? themeLight
                : themeDark;
    });

    React.useEffect(() => {
        const { themeLight, themeDark } = createThemes();
        const selectedTheme =
            uiTheme === "system"
                ? prefersDarkMode
                    ? themeDark
                    : themeLight
                : uiTheme === "light"
                    ? themeLight
                    : themeDark;
        setTheme(selectedTheme);
    }, [uiTheme, prefersDarkMode, createThemes]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};

export default ThemeWrapper;