import { colors, darken, lighten } from "@mui/material";
import createPalette from "@mui/material/styles/createPalette";

const palette = createPalette({
    mode: 'light',
    sideBar: {
        main: colors.blueGrey[400],
        light: lighten(colors.blueGrey[400], 0.2),
        dark: darken(colors.blueGrey[400], 0.2),
        contrastText: colors.blueGrey[900],
        icon: colors.blueGrey[800],
    },
    menuBar: {
        main: colors.blueGrey[400],
        light: lighten(colors.blueGrey[400], 0.2),
        dark: darken(colors.blueGrey[400], 0.2),
        contrastText: colors.blueGrey[900],
        icon: colors.blueGrey[800],
    },
    statusBar: {
        main: colors.blueGrey[400],
        light: lighten(colors.blueGrey[400], 0.2),
        dark: darken(colors.blueGrey[400], 0.2),
        contrastText: colors.blueGrey[900],
        icon: colors.blueGrey[800],
    },
    background: {
        sideBar: lighten(colors.blueGrey[100], 0.5),
        menuBar: lighten(colors.blueGrey[100], 0.2),
        statusBar: lighten(colors.blueGrey[100], 0.5),
        table: {
            header: colors.green[200],
            container: lighten(colors.blueGrey[50], 0.6),
            footer: colors.brown[100],
        },
    },
    table: {
        main: colors.blueGrey[300],
        light: lighten(colors.blueGrey[300], 0.3),
        dark: darken(colors.blueGrey[300], 0.3),
        contrastText: colors.blueGrey[900],
        icon: colors.blueGrey[200],
    },
    dataType: {
        boolean: colors.purple[800],
        datetime: colors.green[800],
        number: colors.red[800],
        string: colors.grey[900],
        object: colors.grey[900],
        binary: colors.grey[900],
        null: colors.grey[500],
    },
    text: {
        primary: '#0f0f0f',
        //icon: '#ffee58'
    }
});

export default palette;