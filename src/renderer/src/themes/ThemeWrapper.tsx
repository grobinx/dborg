import React from "react";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useSettings } from "../contexts/SettingsContext";
import defaultDarkPalette from '../themes/palettes/defaultDark';
import defaultLightPalette from '../themes/palettes/defaultLight';
import defaultLayout from '../themes/layouts/defaultLayout';
import defaultIcons from '../themes/icons/defaultIcons';
import rootLayout from '../themes/layouts/root';
import { UiSettings } from "@renderer/app.config";

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [ui] = useSettings<UiSettings>("ui");

    const prefersDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const createThemes = React.useCallback(() => {
        const themeLight = createTheme(
            {
                ...rootLayout,
                palette: defaultLightPalette,
            },
            defaultLayout(defaultLightPalette),
            defaultIcons(defaultLightPalette)
        );

        const themeDark = createTheme(
            {
                ...rootLayout,
                palette: defaultDarkPalette,
            },
            defaultLayout(defaultDarkPalette),
            defaultIcons(defaultDarkPalette)
        );

        return { themeLight, themeDark };
    }, []);

    const [theme, setTheme] = React.useState(() => {
        const { themeLight, themeDark } = createThemes();
        return ui.theme === "system"
            ? prefersDarkMode
                ? themeDark
                : themeLight
            : ui.theme === "light"
            ? themeLight
            : themeDark;
    });

    React.useEffect(() => {
        const { themeLight, themeDark } = createThemes();
        const selectedTheme =
            ui.theme === "system"
                ? prefersDarkMode
                    ? themeDark
                    : themeLight
                : ui.theme === "light"
                ? themeLight
                : themeDark;
        setTheme(selectedTheme);
    }, [ui.theme, prefersDarkMode, createThemes]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};

export default ThemeWrapper;