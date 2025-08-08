import { colors, darken, lighten } from "@mui/material";
import createPalette from "@mui/material/styles/createPalette";
import { createPaletteColor } from "../utils";

const palette = createPalette({
    mode: 'light',
    main: createPaletteColor(colors.grey[600], colors.grey[50]),
    sideBar: createPaletteColor(colors.blueGrey[400], colors.blueGrey[900]),
    menuBar: createPaletteColor(colors.blueGrey[400], colors.blueGrey[900]),
    statusBar: createPaletteColor(colors.blueGrey[400], colors.blueGrey[900]),
    table: createPaletteColor(colors.blueGrey[300], colors.blueGrey[900]),
    background: {
        sideBar: lighten(colors.blueGrey[100], 0.5),
        menuBar: lighten(colors.blueGrey[100], 0.2),
        statusBar: lighten(colors.blueGrey[100], 0.5),
        table: {
            header: colors.green[200],
            container: lighten(colors.blueGrey[50], 0.6),
            footer: colors.brown[100],
        },
        tooltip: colors.blueGrey[800],
    },
    dataType: {
        boolean: colors.purple[800],
        datetime: colors.green[800],
        number: colors.red[800],
        string: colors.grey[900],
        object: colors.grey[900],
        binary: colors.grey[900],
        null: colors.grey[500],
        error: colors.red[700],
        array: undefined, //colors.blue[800],
    },
    text: {
        primary: '#0f0f0f',
        //icon: '#ffee58'
    }
});

export default palette;