import { Button, ButtonProps, Collapse, styled, Tooltip, Typography, useThemeProps } from "@mui/material";
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
    title?: string,
}

const ContainerButtonRoot = styled(Button, {
    name: 'ContainerButton', // The component name
    slot: 'root', // The slot name
})(({ theme }) => ({
    minWidth: 0,
    color: theme.palette.sideBar.contrastText,
    lineHeight: 0,
    fontSize: "inherit",
    '& .IconWrapper-root': {
        color: theme.palette.sideBar.icon,
    },
}));

const ContainerButton: React.FC<ContainerButtonOwnProps> = (props) => {
    const { toolTip, expanded, selected, className, itemID, placement, icon, title, ...other } = useThemeProps({ name: 'ContainerButton', props });
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
            title={toolTip ?? title}
            disableHoverListener={expanded}
            placement={position.toolTipPlacement}
            arrow={true}
        >
            <ContainerButtonRoot
                {...other}
                className={(className ?? "") +" ContainerButton-root" +(selected ? " Mui-selected" : "")}
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
                            variant="button"
                            component="div"
                            noWrap={true}
                            fontSize="inherit"
                            maxWidth="inherit"
                        >
                            {title}
                        </Typography> :
                        <Collapse in={expanded} orientation="vertical" timeout={100}>
                            <Typography
                                variant="button"
                                component="div"
                                noWrap={false}
                                fontSize="inherit"
                                minWidth="5.6rem"
                                maxWidth="5.6rem"
                            >
                                {title}
                            </Typography>
                        </Collapse>
                    }

                </Collapse>
            </ContainerButtonRoot>
        </Tooltip>
    );
}

export default ContainerButton;
