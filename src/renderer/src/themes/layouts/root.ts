import { createTheme, ThemeOptions } from "@mui/material";
import { useSetting } from "@renderer/contexts/SettingsContext";

const root = (fontSize: number, fontFamily: string, monospaceFontFamily: string): ThemeOptions => {
    const rootTheme = createTheme();

    return {
        spacing: 1,
        typography: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            monospaceFontFamily: monospaceFontFamily,
        },

        shape: rootTheme.shape,
        shadows: rootTheme.shadows,
        breakpoints: rootTheme.breakpoints,
        zIndex: rootTheme.zIndex,
        mixins: rootTheme.mixins,
        transitions: rootTheme.transitions,

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    "*": {
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(100, 100, 100, 0.5) transparent",
                    },
                    "*::-webkit-scrollbar": {
                        width: "14px",
                        height: "14px",
                    },
                    "*::-webkit-scrollbar-track": {
                        background: "rgba(0, 0, 0, 0.03)",
                        borderRadius: "12px",
                        margin: "2px",
                        boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.1)",
                    },
                    "*::-webkit-scrollbar-thumb": {
                        background: "linear-gradient(135deg, rgba(120, 120, 120, 0.5) 0%, rgba(80, 80, 80, 0.6) 100%)",
                        borderRadius: "12px",
                        border: "3px solid transparent",
                        backgroundClip: "padding-box",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            background: "linear-gradient(135deg, rgba(140, 140, 140, 0.7) 0%, rgba(100, 100, 100, 0.8) 100%)",
                            backgroundClip: "padding-box",
                            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.3)",
                            transform: "scale(1.05)",
                        },
                        "&:active": {
                            background: "linear-gradient(135deg, rgba(160, 160, 160, 0.9) 0%, rgba(120, 120, 120, 1) 100%)",
                            backgroundClip: "padding-box",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
                            transform: "scale(0.98)",
                        }
                    },
                    "*::-webkit-scrollbar-corner": {
                        backgroundColor: "transparent"
                    }
                }
            }
        }
    };
}

export default root;