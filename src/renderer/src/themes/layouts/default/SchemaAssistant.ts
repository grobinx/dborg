import { Palette, ThemeOptions } from "@mui/material";
import { SchemaAssistantComponent } from "@renderer/themes/theme.d/SchemaAssistant";

export const SchemaAssistantLayout = (palette: Palette, _root: ThemeOptions): SchemaAssistantComponent => {
    return {
        defaultProps: {
            slotProps: {
                button: {
                },
                stepperTitle: {
                    variant: "body1"
                },
            }
        },
        styleOverrides: {
            root: {
                gap: 16,
                padding: 16,
                width: "90%",
                margin: "auto"
            },
            title: {
                //justifyItems: "center",
                paddingBottom: 6,
                borderBottom: "1px solid",
                borderColor: palette.action.focus,
                width: "100%",
                paddingLeft: 16,
                paddingRight: 16,
                display: "flex"
            },
            buttons: {
                paddingTop: 6,
                borderTop: "1px solid",
                borderColor: palette.action.focus,
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16
            },
            stepper: {
                width: "95%",
            },
            content: {
                width: "95%",
            }
        }
    }
};
