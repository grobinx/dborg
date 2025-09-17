import { Palette, ThemeOptions } from "@mui/material";
import { ShortcutComponent } from "@renderer/themes/theme.d/Shortcut";

export const ShortcutLayout = (palette: Palette, _root: ThemeOptions): ShortcutComponent => {
    return {
        styleOverrides: {
            root: {
                transition: "all 0.2s ease-in-out",
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75em',
                fontFamily: "monospace",
                fontWeight: 600,
                lineHeight: 1,
                gap: 6,
                '&.hidden': {
                    display: 'none',
                },
                '&:not(.active)': {
                    opacity: 0.5,
                }
            },
            chord: {
                transition: "all 0.2s ease-in-out",
                display: "flex",
                gap: 2,
                alignItems: "center",
            },
            key: {
                transition: "all 0.2s ease-in-out",
                display: "inline-block",
                padding: "2px 4px",
                background: "#f5f5f5",
                border: "1px solid #ccc",
                borderRadius: "3px",
                color: "#333",
                verticalAlign: "middle",
                userSelect: "none",
                '&.active': {
                    boxShadow: "inset 0 -1px 0 #bbb",
                }
            }
        }
    }
};
