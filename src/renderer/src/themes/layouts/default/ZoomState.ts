import { darken, lighten, Palette, ThemeOptions } from "@mui/material";
import { ZoomStateComponent } from "@renderer/themes/theme.d/ZoomState";

export const ZoomStateLayout = (palette: Palette, _root: ThemeOptions): ZoomStateComponent => {
    return {
        defaultProps: {
        },
        styleOverrides: {
            root: {
                //fontSize: "0.8rem"
                backgroundColor:
                    palette.mode === "dark" ?
                        lighten(palette.background.menuBar, 0.1) :
                        darken(palette.background.menuBar, 0.1),
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 2,
                paddingBottom: 2,
                margin: 2,
                borderRadius: 4
            },
            value: {
                //fontSize: "0.8rem",
                paddingLeft: 4
            }
        }
    }
};
