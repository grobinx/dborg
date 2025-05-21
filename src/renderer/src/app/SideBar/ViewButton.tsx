import { Button, ButtonProps, Collapse, styled, Tooltip, Typography, useThemeProps, Zoom } from "@mui/material";
import React, { ReactElement, ReactNode } from "react";
import { Placement } from "./ContainerButton";

export interface ViewButtonProps extends ButtonProps {
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

const ViewButtonRoot = styled(Button, {
    name: 'ViewButton', // The component name
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

const ViewButton: React.FC<ViewButtonOwnProps> = (props) => {
    const { toolTip, expanded, selected, className, itemID, placement, icon, label, index, ...other } = useThemeProps({ name: 'ViewButton', props });
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
                arrow={true}
            >
                <ViewButtonRoot
                    {...other}
                    className={(className ?? "") + " ViewButton-root" + (selected ? " Mui-selected" : "")}
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
                                {label}
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
                                    {label}
                                </Typography>
                            </Collapse>
                        }

                    </Collapse>
                </ViewButtonRoot>
            </Tooltip>
        </Zoom>
    );
}

export default ViewButton;
