import { Button, Collapse, styled, Typography, useThemeProps, Zoom } from "@mui/material";
import React, { ReactNode } from "react";
import { Placement } from "./ContainerButton";
import Tooltip from "@renderer/components/Tooltip";
import clsx from "@renderer/utils/clsx";
import { BaseButton } from "@renderer/components/buttons/BaseButton";
import { BaseButtonProps } from "@renderer/components/buttons/BaseButtonProps";

export interface ViewButtonProps extends BaseButtonProps {
}

interface ViewButtonOwnProps extends ViewButtonProps {
    toolTip?: string,
    expanded: boolean,
    selected: boolean,
    placement?: Placement,
    icon?: ReactNode,
    label?: string,
    index?: number,
}

const ViewButton: React.FC<ViewButtonOwnProps> = (props) => {
    const { toolTip, expanded, className, placement, icon, label, index, ...other } = useThemeProps({ name: 'ViewButton', props });
    const [position, setPosition] = React.useState<{
        horizontal: boolean,
        toolTipPlacement: Placement,
        stackDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse'
    }>({ horizontal: true, toolTipPlacement: "right", stackDirection: "row" });

    React.useEffect(() => {
        let toolTipPlacement: Placement;
        let stackDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse';
        switch (placement ?? "left") {
            case "top": toolTipPlacement = "bottom"; stackDirection = "column"; break;
            case "bottom": toolTipPlacement = "top"; stackDirection = "column"; break;
            case "left": toolTipPlacement = "right"; stackDirection = "row"; break;
            case "right": toolTipPlacement = "left"; stackDirection = "row-reverse"; break;
        }
        const horizontal = ["left", "right"].includes(placement ?? "left");
        setPosition({ horizontal, toolTipPlacement, stackDirection });
    }, [expanded, placement]);

    return (
        <Zoom in={true} style={{ transitionDelay: index ? `${50 * index}ms` : undefined }}>
            <Tooltip
                title={toolTip ?? label}
                disableHoverListener={expanded}
                placement={position.toolTipPlacement}
            >
                <BaseButton
                    componentName="ViewButton"
                    {...other}
                    className={clsx(
                        `placement-${placement}`,
                        expanded && 'expanded'
                    )}
                >
                    {icon}
                    <Collapse in={expanded} orientation="horizontal" timeout={100}>
                        {position.horizontal ?
                            <Typography
                                component="div"
                                noWrap={true}
                                maxWidth="inherit"
                                fontSize="inherit"
                            >
                                {label}
                            </Typography> :
                            <Collapse in={expanded} orientation="vertical" timeout={100}>
                                <Typography
                                    component="div"
                                    noWrap={false}
                                    width="min-content"
                                    fontSize="inherit"
                                >
                                    {label}
                                </Typography>
                            </Collapse>
                        }

                    </Collapse>
                </BaseButton>
            </Tooltip>
        </Zoom>
    );
}

export default ViewButton;
