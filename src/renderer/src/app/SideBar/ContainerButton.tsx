import { Button, ButtonProps, Collapse, styled, Typography, useThemeProps } from "@mui/material";
import { BaseButton } from "@renderer/components/buttons/BaseButton";
import { BaseButtonProps } from "@renderer/components/buttons/BaseButtonProps";
import Tooltip from "@renderer/components/Tooltip";
import clsx from "@renderer/utils/clsx";
import React, { ReactElement, ReactNode } from "react";

export type Placement = "top" | "bottom" | "left" | "right";

export interface ContainerButtonProps extends BaseButtonProps {
}

interface ContainerButtonOwnProps extends ContainerButtonProps {
    toolTip?: string,
    expanded: boolean,
    selected: boolean,
    placement?: Placement,
    icon?: ReactNode,
    label?: string,
}

const ContainerButton: React.FC<ContainerButtonOwnProps> = (props) => {
    const { toolTip, expanded, className, placement, icon, label, ...other } = useThemeProps({ name: 'ContainerButton', props });
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
        <Tooltip
            title={toolTip ?? label}
            disableHoverListener={expanded}
            placement={position.toolTipPlacement}
        >
            <BaseButton
                componentName="ContainerButton"
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
        </Tooltip >
    );
}

export default ContainerButton;
