import { createTheme, ThemeOptions } from "@mui/material";
import { useSetting } from "@renderer/contexts/SettingsContext";

const root = (fontSize: number, fontFamily: string, monospaceFontFamily: string, mode: "light" | "dark" = "light"): ThemeOptions => {
    const rootTheme = createTheme({ palette: { mode } });

    // Kolory dla light i dark
    const scrollbarColors =
        mode === "dark"
            ? {
                track: "rgba(255,255,255,0.07)",
                thumb: "linear-gradient(135deg, rgba(80,80,80,0.7) 0%, rgba(120,120,120,0.8) 100%)",
                thumbHover: "linear-gradient(135deg, rgba(100,100,100,0.9) 0%, rgba(160,160,160,1) 100%)",
                thumbActive: "linear-gradient(135deg, rgba(120,120,120,1) 0%, rgba(180,180,180,1) 100%)",
            }
            : {
                track: "rgba(0,0,0,0.03)",
                thumb: "linear-gradient(135deg, rgba(100,100,100,0.5) 0%, rgba(80,80,80,0.6) 100%)",
                thumbHover: "linear-gradient(135deg, rgba(120,120,120,0.7) 0%, rgba(100,100,100,0.8) 100%)",
                thumbActive: "linear-gradient(135deg, rgba(140,140,140,0.9) 0%, rgba(120,120,120,1) 100%)",
            };

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
                    // Chromium/WebKit
                    // '*::-webkit-scrollbar': {
                    //     width: '14px',
                    //     height: '14px',
                    // },
                    // '*::-webkit-scrollbar-track': {
                    //     background: scrollbarColors.track,
                    //     borderRadius: 0,
                    //     margin: 0,
                    //     boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.1)',
                    // },
                    // '*::-webkit-scrollbar-thumb': {
                    //     background: scrollbarColors.thumb,
                    //     borderRadius: 0,
                    //     border: '3px solid transparent',
                    //     backgroundClip: 'padding-box',
                    // },
                    // '*::-webkit-scrollbar-thumb:hover': {
                    //     background: scrollbarColors.thumbHover,
                    //     backgroundClip: 'padding-box',
                    // },
                    // '*::-webkit-scrollbar-thumb:active': {
                    //     background: scrollbarColors.thumbActive,
                    //     backgroundClip: 'padding-box',
                    // },
                    // '*::-webkit-scrollbar-corner': {
                    //     backgroundColor: 'transparent',
                    // },
                    'html': {
                        scrollbarColor: mode === "dark"
                            ? "rgba(120,120,120,0.7) rgba(255,255,255,0.07)"
                            : "rgba(120,120,120,0.4) rgba(0,0,0,0.03)",
                        scrollbarWidth: 'thin',
                    },
                }
            }
        }
    };
}

export default root;