import { Palette, ThemeOptions } from "@mui/material";
import { CodeComponent } from "@renderer/themes/theme.d/Code";

export const CodeLayout = (palette: Palette, _root: ThemeOptions): CodeComponent => {
    const mode = palette.mode;
    return {
        styleOverrides: {
            root: {
                backgroundColor: 'rgba(245, 245, 245, 0.3)',
                fontFamily: 'monospace',
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.9em',
                '&:not(pre > &)': {
                    backgroundColor: mode === 'dark' ? 'rgba(150, 150, 150, 0.3)' : 'rgba(200, 200, 200, 0.3)', // Styl dla <code> poza <pre>
                },
                'pre > &': {
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Styl dla <code> wewnątrz <pre>
                    padding: '8px',
                    borderRadius: '5px',
                    display: 'block',
                },
            }
        }
    };
};