import { Palette, ThemeOptions } from "@mui/material";
import { TreeComponent } from "@renderer/themes/theme.d/Tree";

export const TreeLayout = (palette: Palette, _root: ThemeOptions): TreeComponent => {
    return {
        styleOverrides: {
            root: {
                transition: "all 0.2s ease-in-out",
                outline: 'none',
                height: '100%',
                width: '100%',
                overflowY: 'auto',
            },
            node: {
                transition: "all 0.2s ease-in-out",
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                outline: `1px solid transparent`,
                border: 'none',
                padding: '0.05em calc(var(--node-level, 0) * 8px + 8px)',
                outlineOffset: -1,
                '&.selected': {
                    backgroundColor: palette.action.selected,
                    '&.focused': {
                        outline: `1px solid ${palette.action.focus}`,
                    },
                },
            },
            toggleIcon: {
                width: '1.5em',
            },
            label: {
                alignContent: 'center',
            },
        }
    };
};