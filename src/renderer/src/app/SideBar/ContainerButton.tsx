import { Button, ButtonProps, Collapse, styled, Typography, useThemeProps } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import clsx from "@renderer/utils/clsx";
import React, { ReactElement, ReactNode } from "react";

export type Placement = "top" | "bottom" | "left" | "right";

export interface ContainerButtonProps extends ButtonProps {
}

interface ContainerButtonOwnProps extends ContainerButtonProps {
    toolTip?: string,
    expanded: boolean,
    selected: boolean,
    placement?: Placement,
    icon?: ReactNode,
    label?: string,
}

const ContainerButtonRoot = styled(Button, {
    name: 'ContainerButton', // The component name
    slot: 'root', // The slot name
})(({ theme }) => ({
    minWidth: 0,
    color: theme.palette.sideBar.contrastText,
    lineHeight: 0,
    fontSize: "inherit",
}));

const ContainerButton: React.FC<ContainerButtonOwnProps> = (props) => {
    const { toolTip, expanded, selected, className, itemID, placement, icon, label, ...other } = useThemeProps({ name: 'ContainerButton', props });
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
            <ContainerButtonRoot
                {...other}
                className={clsx(className, "ContainerButton-root", selected && 'selected')}
                fullWidth={position.horizontal}
                sx={{
                    justifyContent: 'flex-start',
                    flexDirection: position.stackDirection,
                }}
            >
                {icon}
                <Collapse in={expanded} orientation="horizontal" timeout={100}>
                    {position.horizontal ?
                        <Typography
                            component="div"
                            noWrap={true}
                            maxWidth="inherit"
                        >
                            {label}
                        </Typography> :
                        <Collapse in={expanded} orientation="vertical" timeout={100}>
                            <Typography
                                component="div"
                                noWrap={false}
                                minWidth="5.6rem"
                                width="min-content"
                            >
                                {label}
                            </Typography>
                        </Collapse>
                    }

                </Collapse>
            </ContainerButtonRoot>
        </Tooltip >
    );
}

export default ContainerButton;
