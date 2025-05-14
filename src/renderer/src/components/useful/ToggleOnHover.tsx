import React, { MouseEventHandler, useEffect } from "react";

export interface ToggleOnHover {
    primary: React.ReactNode,
    secondary: React.ReactNode,
    hovered?: boolean
}

const ToggleOnHover: React.FC<ToggleOnHover> = (props) => {
    const { primary, secondary, hovered } = props;
    const [icon, setIcon] = React.useState(primary);


    const onMouseOverHandle: MouseEventHandler = () => {
        if (hovered === undefined || !hovered) {
            setIcon(secondary);
        }
    }

    const onMouseLeaveHandle: MouseEventHandler = () => {
        if (hovered === undefined || !hovered) {
            setIcon(primary);
        }
    }

    if (hovered !== undefined) {
        useEffect(() => {
            setIcon(hovered ? secondary : primary);
        }, [hovered])
    }

    return (
        <div style={{ display: "flex" }}
            onMouseOver={onMouseOverHandle}
            onMouseLeave={onMouseLeaveHandle}
        >
            {icon}
        </div>
    )
}

export default ToggleOnHover;
