import { styled } from "@mui/material";
import { useState } from "react";
import { getRandomDelays } from "./core";

const LoadingSpinnerRingStyled = styled("div")<{
    speed: number;
    colors: string[];
    size?: number;
}>(({ speed, colors, size = 54 }) => {
    const [delays] = useState(() => getRandomDelays(4, -0.5, 0));
    
    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-block",
        position: "relative",
        "& div": {
            boxSizing: "border-box",
            display: "block",
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            border: `${size / 9}px solid`,
            borderColor: `${colors[0]} transparent transparent transparent`,
            borderRadius: "50%",
            animation: `lds-ring-spin ${speed}s cubic-bezier(0.5, 0, 0.5, 1) infinite`,
        },
        "& div:nth-of-type(1)": {
            borderColor: `${colors[0]} transparent transparent transparent`,
            animationDelay: delays?.[0] ?? "-0.45s",
        },
        "& div:nth-of-type(2)": {
            borderColor: `${colors[1]} transparent transparent transparent`,
            animationDelay: delays?.[1] ?? "-0.3s",
        },
        "& div:nth-of-type(3)": {
            borderColor: `${colors[2]} transparent transparent transparent`,
            animationDelay: delays?.[2] ?? "-0.15s",
        },
        "& div:nth-of-type(4)": {
            borderColor: `${colors[3]} transparent transparent transparent`,
            animationDelay: delays?.[3] ?? "0s",
        },
        "@keyframes lds-ring-spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
        },
    }
});

function LoadingSpinnerRing({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerRingStyled speed={1.2} colors={colors} size={size}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </LoadingSpinnerRingStyled>
    );
}

export default LoadingSpinnerRing;