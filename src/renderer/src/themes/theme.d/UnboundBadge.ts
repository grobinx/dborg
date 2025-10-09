import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import UnboundBadge from "@renderer/components/UnboundBadge";

export type UnboundBadgeComponentProps = Partial<React.ComponentProps<typeof UnboundBadge>>;

export type UnboundBadgeComponent = {
    defaultProps?: ComponentsPropsList['UnboundBadge'];
    styleOverrides?: ComponentsOverrides<Theme>['UnboundBadge'];
}

export type UnboundBadgeComponentSlots =
    "root"
    ;
