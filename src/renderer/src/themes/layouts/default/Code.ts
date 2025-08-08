import { Palette, ThemeOptions } from "@mui/material";
import { CodeComponent } from "@renderer/themes/theme.d/Code";

export const CodeLayout = (_palette: Palette, _root: ThemeOptions): CodeComponent => {
    return {
        styleOverrides: {
            root: {
                backgroundColor: 'rgba(245, 245, 245, 0.3)',
                fontFamily: 'monospace',
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.9em',
                '&:not(pre > &)': {
                    backgroundColor: 'rgba(245, 245, 245, 0.3)', // Styl dla <code> poza <pre>
                },
                'pre > &': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Styl dla <code> wewnątrz <pre>
                    padding: '8px',
                    borderRadius: '5px',
                    display: 'block',
                },
            }
        }
    };
};