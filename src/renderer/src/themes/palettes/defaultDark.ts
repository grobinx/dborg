import { colors, darken, lighten } from "@mui/material";
import createPalette from "@mui/material/styles/createPalette";

const palette = createPalette({
    mode: 'dark',
    sideBar: {
        main: colors.blueGrey[500],
        light: lighten(colors.blueGrey[500], 0.2),
        dark: darken(colors.blueGrey[500], 0.2),
        contrastText: colors.blueGrey[100],
        icon: colors.blueGrey[200],
    },
    menuBar: {
        main: colors.blueGrey[500],
        light: lighten(colors.blueGrey[500], 0.2),
        dark: darken(colors.blueGrey[500], 0.2),
        contrastText: colors.blueGrey[100],
        icon: colors.blueGrey[200],
    },
    statusBar: {
        main: colors.blueGrey[500],
        light: lighten(colors.blueGrey[500], 0.2),
        dark: darken(colors.blueGrey[500], 0.2),
        contrastText: colors.blueGrey[100],
        icon: colors.blueGrey[200],
    },
    table: {
        main: colors.blueGrey[500],
        light: lighten(colors.blueGrey[500], 0.2),
        dark: darken(colors.blueGrey[500], 0.2),
        contrastText: colors.blueGrey[100],
        icon: colors.blueGrey[200],
    },
    background: {
        sideBar: darken(colors.blueGrey[900], 0.5),
        menuBar: darken(colors.blueGrey[900], 0.2),
        statusBar: darken(colors.blueGrey[900], 0.5),
        table: {
            header: darken(colors.green[900], 0.2),
            container: darken(colors.blueGrey[900], 0.2),
            footer: colors.brown[900],
        },
        tooltip: colors.blueGrey[800],
    },
    dataType: {
        boolean: colors.purple[200],
        datetime: colors.green[200],
        number: colors.red[200],
        string: colors.grey[100],
        object: colors.grey[100],
        binary: colors.grey[100],
        null: colors.grey[600],
        error: colors.red[300],
        array: undefined, // colors.blue[200],
    },
    text: {
        primary: '#f0f0f0',
        //icon: '#ffee58'
    }
});

export default palette;