import { alpha, darken, createTheme } from "@mui/material/styles";
import { createPaletteColor } from "../../utils/colors";
import { colors } from "@mui/material";

const theme = createTheme({
    palette: {
        mode: "dark",

        // Core MUI colors
        primary: createPaletteColor(colors.indigo[500], colors.indigo[50]),
        secondary: createPaletteColor(colors.deepPurple[400], colors.deepPurple[50]),
        error: createPaletteColor(colors.red[400], colors.red[50]),
        warning: createPaletteColor(colors.amber[600], colors.amber[50]),
        info: createPaletteColor(colors.cyan[400], colors.cyan[50]),
        success: createPaletteColor(colors.teal[400], colors.teal[50]),

        // Utility defaults
        contrastThreshold: 3,
        tonalOffset: 0.2,

        // App-specific semantic colors (kept from previous file, tuned to "space" look)
        main: createPaletteColor(colors.blueGrey[700], colors.blueGrey[50]),
        sideBar: createPaletteColor(colors.indigo[900], colors.indigo[200]),
        menuBar: createPaletteColor(colors.indigo[900], colors.indigo[200]),
        statusBar: createPaletteColor(colors.blueGrey[900], colors.blueGrey[100]),
        table: createPaletteColor(colors.blueGrey[800], colors.blueGrey[100]),

        // Backgrounds - deep space tones and subtle nebula accents
        background: {
            default: "#071020", // deep space
            paper: "#0f1a2b",   // surface panels
            sideBar: darken("#071022", 0.1),
            menuBar: darken("#071022", 0.05),
            statusBar: darken("#071022", 0.12),
            table: {
                header: "#0b2a3d",
                container: darken("#071020", 0.06),
                footer: "#081827",
                selected: "#112a44",
            },
            tooltip: darken("#071020", 0.05),
            header: "#08142a",
        },

        // Data type colors — star/nebula palette
        dataType: {
            boolean: colors.teal[200],
            datetime: colors.cyan[200],
            number: colors.orange[200],
            string: colors.grey[200],
            object: colors.deepPurple[200],
            binary: colors.grey[200],
            null: colors.grey[600],
            error: colors.red[300],
            array: colors.blue[200],
        },

        // Text tuned for readability on deep backgrounds
        text: {
            primary: "#e6f0ff",
            secondary: colors.blueGrey[200],
            disabled: colors.blueGrey[600],
        },

        // Actions (hover/focus/selected) using faint cosmic glows
        action: {
            active: alpha(colors.cyan[200], 0.45),
            focus: alpha(colors.cyan[200], 0.25),
            hover: alpha(colors.cyan[200], 0.12),
            selected: alpha(colors.cyan[200], 0.14),
            disabled: colors.grey[800],
            disabledBackground: colors.grey[900],
            hoverOpacity: 0.08,
            focusOpacity: 0.18,
            selectedOpacity: 0.18,
            activatedOpacity: 0.22,
        },

        // Divider and common helpers
        divider: alpha(colors.blueGrey[100], 0.08),
        common: {
            black: "#000000",
            white: "#ffffff",
        },
    },
});

const palette = theme.palette;
export default palette;