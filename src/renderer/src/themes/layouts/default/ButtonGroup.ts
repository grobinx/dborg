import { Palette, ThemeOptions } from "@mui/material";
import { ButtonGroupComponent } from "../../theme.d/ButtonGroup";


export const ButtonGroupLayout = (_palette: Palette, _root: ThemeOptions): ButtonGroupComponent => {
    return {
        styleOverrides: {
            root: {
                display: 'inline-flex',
                gap: 0,
                transition: "all 0.2s ease-in-out",

                // Pozycjonowanie przycisków - usuń border radius z środkowych
                '&.orientation-horizontal': {
                    flexDirection: 'row',
                    '& .ButtonGroup-button': {
                        marginLeft: 0, // Nakładanie borders dla seamless look

                        '&:first-of-type:not(:only-of-type)': {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            marginLeft: 0,
                        },

                        '&:last-of-type:not(:only-of-type)': {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                        },

                        '&:not(:first-of-type):not(:last-of-type)': {
                            borderRadius: 0,
                        },

                        '&:only-of-type': {
                            marginLeft: 0,
                        },

                        // Z-index dla hover/focus effects
                        '&:hover, &:focus, &.selected': {
                            zIndex: 1,
                        },
                    },
                },
                '&.orientation-vertical': {
                    flexDirection: 'column',

                    '& .ButtonGroup-button': {
                        marginTop: -1, // Nakładanie borders dla seamless look

                        '&:first-of-type': {
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            marginTop: 0,
                        },

                        '&:last-of-type': {
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                        },

                        '&:not(:first-of-type):not(:last-of-type)': {
                            borderRadius: 0,
                        },

                        '&:only-of-type': {
                            marginTop: 0,
                        },

                        // Z-index dla hover/focus effects
                        '&:hover, &:focus, &.selected': {
                            zIndex: 1,
                        },
                    },
                },

                // Same size modifier classes
                '&.same-size': {
                    '&.orientation-vertical': {
                        alignItems: 'stretch',
                    },
                },
            },
        },
    };
};
