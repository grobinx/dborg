import { MinimizeTwoTone } from "@mui/icons-material";
import { Palette, ThemeOptions } from "@mui/material";
import { FormattedTextComponent } from "@renderer/themes/theme.d/FormattedText";

export const FormattedTextLayout = (_palette: Palette, _root: ThemeOptions): FormattedTextComponent => {
    return {
        styleOverrides: {
            root: {
                // Ogólny paragraf: normalne zawijanie
                '& .paragraph': {
                    whiteSpace: "pre-wrap",
                    display: "inline",
                    margin: 0,
                },
                // Inline code: nie rozbija wiersza, może się zawinąć sensownie
                '& .paragraph code': {
                    display: "inline",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                },
                // Akapit zawierający ikonę: trzymaj ikonę + pierwszy wyraz razem
                '& .paragraph:has(.IconWrapper-root)': {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                },
                // Wrapper ikony: pojedynczy inline box, wyśrodkowany pionowo
                '& .IconWrapper-root': {
                    display: "inline-flex",
                    alignItems: "center",
                },
                // Listy: jak dotychczas
                '& ul': {
                    whiteSpace: "pre-wrap",
                    display: "flex",
                    alignItems: "center",
                    margin: 0,
                }
            }
        }
    }
};
