import { useThemeProps } from "@mui/material";
import { BaseButton } from "@renderer/components/buttons/BaseButton";
import Tooltip from "@renderer/components/Tooltip";
import React from "react";

export interface WindowControlButtonProps extends React.ComponentProps<typeof BaseButton> {
}

interface WindowControlButtonOwnProps extends WindowControlButtonProps {
    toolTip?: string,
}

const WindowControlButton: React.FC<WindowControlButtonOwnProps> = (props) => {
    const { toolTip, className, ...other } = useThemeProps({ name: 'WindowControlButton', props });
    return (
        <Tooltip title={toolTip}>
            <BaseButton
                componentName="WindowControlButton"
                {...other}
                className={className}
            >
                {other.children}
            </BaseButton>
        </Tooltip>
    );
}

export default WindowControlButton;
