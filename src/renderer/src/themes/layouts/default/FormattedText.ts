import { Palette, ThemeOptions } from "@mui/material";
import { FormattedTextComponent } from "@renderer/themes/theme.d/FormattedText";

export const FormattedTextLayout = (_palette: Palette, _root: ThemeOptions): FormattedTextComponent => {
    return {
        styleOverrides: {
            root: {
                '& p': {
                    whiteSpace: "pre-wrap",
                    display: "flex",
                    alignItems: "center",
                    margin: 0,
                },
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
