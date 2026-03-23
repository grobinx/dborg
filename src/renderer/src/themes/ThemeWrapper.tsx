import React from "react";
import { ThemeProvider, CssBaseline, createTheme, Theme } from "@mui/material";
import { useSetting } from "../contexts/SettingsContext";
import defaultLayout from '../themes/layouts/defaultLayout';
import defaultIcons from '../themes/icons/defaultIcons';
import rootLayout from '../themes/layouts/root';
import { ThemeIcons } from "./icons";

import './palettes/default';
import './palettes/space';
import { getPalette } from "./palettes/registry";

export let icons: ThemeIcons | undefined = undefined;

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [uiTheme] = useSetting<"system" | "light" | "dark">("ui", "theme", "system");
    const [uiPalette] = useSetting("ui", "palette", "default");
    const [fontSize] = useSetting<number>("ui", "fontSize", 14);
    const [fontFamily] = useSetting<string>("ui", "fontFamily");
    const [monospaceFontFamily] = useSetting<string>("ui", "monospaceFontFamily");

    const prefersDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const createThemes = React.useCallback(() => {
        const root = rootLayout(
            fontSize, 
            fontFamily, 
            monospaceFontFamily, 
            uiTheme === "system" ? (prefersDarkMode ? "dark" : "light") : uiTheme
        );

        const palette = getPalette(uiPalette, uiTheme === "system" ? (prefersDarkMode ? "dark" : "light") : uiTheme);

        const theme = createTheme(
            {
                ...root,
                palette: palette,
            },
            defaultLayout(palette, root),
            defaultIcons(palette)
        );

        return theme;
    }, [uiTheme, uiPalette, fontSize, fontFamily, monospaceFontFamily]);

    const selectedTheme = () => {
        const theme = createThemes();
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