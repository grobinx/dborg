import { Palette, ThemeOptions } from "@mui/material";
import { SideBarComponent } from "@renderer/themes/theme.d/SideBar";
import { ToastListComponent } from "@renderer/themes/theme.d/ToastList";

export const ToastListLayout = (_palette: Palette, _root: ThemeOptions): ToastListComponent => {
    return {
        defaultProps: {
            slotProps: {
                transition: {
                    component: "Slide",
                    slotProps: {
                        slide: {
                            direction: "right",
                        },
                    }
                }
            }
        },
        styleOverrides: {
            root: {
                left: 32,
                bottom: 32,
            }
        }
    }
};
