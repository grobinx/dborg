import { Palette, ThemeOptions } from "@mui/material";
import { SchemaParametersComponent } from "@renderer/themes/theme.d/SchemaParameters";

export const SchemaParametersLayout = (palette: Palette, _root: ThemeOptions): SchemaParametersComponent => {
    return {
        defaultProps: {
            slotProps: {
                schemaParameters: {
                    sx: {
                        paddingRight: 8,
                        '> .MuiBox-root': {
                            paddingBottom: 16,
                        },
                        '> .MuiBox-root > .MuiTextField-root': {
                            width: "100%",
                        }
                    }
                    //paddingX: 16,
                },
                schemaGroup: {
                    paddingBottom: 16,
                },
                groupProperties: {
                    borderTop: "1px solid",
                    borderColor: palette.action.focus,
                    marginTop: 2,
                    paddingTop: 6,
                    //gap: 10,
                    sx: {
                        '& label.MuiFormControlLabel-root': {
                            marginLeft: 0
                        },
                        '& .MuiFormHelperText-root': {
                            marginTop: 2,
                            fontSize: "0.9rem",
                            lineHeight: 1.2
                        },
                        '& .item': {
                            display: "flex",
                            flexDirection: "column",
                            //flexWrap: "wrap",
                            gap: 4,
                            padding: 10,
                        },
                        '& .item:hover': {
                            background: palette.action.hover,
                        },
                        '& .MuiFormControl-root.MuiTextField-root': {
                            // flexDirection: "row",
                            // alignItems: "center",
                            gap: 8,
                        },
                    }
                },
                schemaDriver: {
                    paddingBottom: 16,
                    sx: {
                        '& .MuiBox-root': {
                            paddingLeft: 10
                        },
                        alignItems: "end"
                    }
                },
                checkBoxField: {
                    sx: {
                        padding: 4,
                    }
                },
            }
        }
    }
};
