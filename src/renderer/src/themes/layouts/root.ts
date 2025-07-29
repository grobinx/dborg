import { ThemeOptions } from "@mui/material";
import { useSetting } from "@renderer/contexts/SettingsContext";

const root = (fontSize: number, fontFamily: string, monospaceFontFamily: string): ThemeOptions => {
    return {
        spacing: 1,
        typography: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            monospaceFontFamily: monospaceFontFamily,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    "*::-webkit-scrollbar": {
                        width: "12px",
                        height: "12px",
                        backgroundColor: "transparent",
                    },
                    "*::-webkit-scrollbar-track": {
                        backgroundColor: "rgba(128,128,128,0.08)", // lekko widoczny tor
                        WebkitBoxShadow: "inset 0 0 6px rgba(128, 128, 128, 0.08)"
                    },
                    "*::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(128, 128, 128, 0.25)", // półprzezroczysty kciuk
                        borderRadius: 3
                    },
                    "*::-webkit-scrollbar-corner": {
                        backgroundColor: "rgba(128,128,128,0.08)"
                    }
                }
            }
        }
    };
}

export default root;