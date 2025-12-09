import { Palette, ThemeOptions } from "@mui/material";
import { ShortcutComponent } from "@renderer/themes/theme.d/Shortcut";

export const ShortcutLayout = (_palette: Palette, _root: ThemeOptions): ShortcutComponent => {
    return {
        styleOverrides: {
            root: {
                display: 'flex',
                alignItems: 'center',
                fontFamily: "monospace",
                fontWeight: 600,
                lineHeight: 1,
                gap: 6,
                '&.hidden': {
                    display: 'none',
                },
                '&:not(.active)': {
                    opacity: 0.5,
                },
                '&.size-small': {
                    fontSize: '0.75em',
                },
                '&.size-medium': {
                    fontSize: '0.9em',
                },
                '&.size-large': {
                    fontSize: '1.1em',
                },
            },
            chord: {
                display: "flex",
                gap: 2,
                alignItems: "center",
            },
            key: {
                display: "inline-block",
                padding: "2px 4px",
                background: "#e5e5e5",
                border: "1px solid #bbb",
                borderRadius: "3px",
                color: "#333",
                verticalAlign: "middle",
                userSelect: "none",
                '&.active': {
                    boxShadow: "inset 0 -1px 0 #aaa",
                }
            }
        }
    }
};
