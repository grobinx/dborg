import { ComponentsOverrides, Theme } from "@mui/material";
import Tree from "@renderer/components/Tree";

export type TreeComponent = {
    styleOverrides?: ComponentsOverrides<Theme>['Tree'];
};

export type TreeComponentSlots = "root" | "node" | "toggleIcon" | "label";

export type TreeComponentProps = Partial<React.ComponentProps<typeof Tree>>;

