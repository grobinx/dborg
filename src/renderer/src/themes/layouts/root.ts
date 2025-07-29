import { ThemeOptions } from "@mui/material";

const root: ThemeOptions = {
    spacing: 1,
    typography: {
        fontFamily: "Segoe WPC,Segoe UI,sans-serif",
        fontSize: 16,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                "*::-webkit-scrollbar": {
                    width: "12px",
                    height: "12px",
                    backgroundColor: "transparent",
                },
                "*::-webkit-scrollbar-track": {
                    backgroundColor: "rgba(128,128,128,0.08)", // lekko widoczny tor
                    WebkitBoxShadow: "inset 0 0 6px rgba(128, 128, 128, 0.08)"
                },
                "*::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(128, 128, 128, 0.25)", // półprzezroczysty kciuk
                    borderRadius: 3
                },
                "*::-webkit-scrollbar-corner": {
                    backgroundColor: "rgba(128,128,128,0.08)"
                }
            }
        }
    }
}

export default root;