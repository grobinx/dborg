import { Box, styled, useTheme, Zoom } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Duration } from "luxon";
import Tooltip from "../Tooltip";
import { ToolButton } from "../buttons/ToolButton";

const spinnerColorsLight = [
    "#1976d2", // niebieski
    "#43a047", // zielony
    "#fbc02d", // żółty
    "#e53935", // czerwony
];
const spinnerColorsDark = [
    "#90caf9", // jasnoniebieski
    "#a5d6a7", // jasnozielony
    "#fff59d", // jasnobrązowy
    "#ef9a9a", // jasnoczerwony
];

export type LoadingOverlayMode = "auto" | "small" | "full";

// Dodaj funkcję pomocniczą do generowania losowych opóźnień
const getRandomDelays = (count: number, min = -0.5, max = 0.0) =>
    Array.from({ length: count }, () =>
        (Math.random() * (max - min) + min).toFixed(2) + "s"
    );

// Funkcja do losowego tasowania tablicy (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const LoadingSpinner = styled("div")<{ 
    speed: number; 
    delays?: string[]; 
    colors: string[];
    size?: number;
    borderWidth?: number;
}>(({ speed, delays, colors, size = 54, borderWidth = 6 }) => {
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
            border: `${borderWidth}px solid`,
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
    };
});

const LoadingLabel = styled("div")<{ color: string }>(({ color }) => ({
    display: "flex",
    flexDirection: "row",
    gap: "6px",
    fontSize: "1.2rem",
    color: color,
}));

const StyledLoadingOverlay = styled("div")<{ labelPosition: "below" | "side" }>(({ theme }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    backdropFilter: "blur(5px)",
    flexDirection: "column",
    backgroundColor:
        theme.palette.mode === "dark"
            ? "rgba(38, 50, 56, 0.6)"
            : "rgba(255, 255, 255, 0.6)",
}));

const SmallSpinnerContainer = styled("div")({
    position: "absolute",
    bottom: "16px",
    right: "16px",
    zIndex: 11,
});

interface LoadingOverlayProps {
    label?: string;
    color?: string;
    delay?: number;
    speed?: number;
    labelPosition?: "below" | "side";
    timeDelaySec?: number;
    onCancelLoading?: () => void;
    mode?: LoadingOverlayMode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    label,
    color,
    delay = 1000,
    speed = 1,
    labelPosition = "below",
    timeDelaySec = 10,
    onCancelLoading,
    mode = "auto",
}) => {
    const theme = useTheme();
    const [show, setShow] = useState<0 | 1 | 2>(0); // 0 = off, 1 = small spinner, 2 = full overlay
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime] = useState(Date.now());
    const { t } = useTranslation();

    const [spinnerColors, setSpinnerColors] = useState(() => {
        return theme.palette.mode === "dark"
            ? shuffleArray(spinnerColorsDark)
            : shuffleArray(spinnerColorsLight);
    });

    useEffect(() => {
        setSpinnerColors(
            theme.palette.mode === "dark"
                ? shuffleArray(spinnerColorsDark)
                : shuffleArray(spinnerColorsLight)
        );
    }, [theme.palette.mode]);

    useEffect(() => {
        if (mode === "small") {
            setShow(1);
        } else if (mode === "full") {
            setShow(2);
        } else {
            // Natychmiastowo po 1/10 delay pokaż mały spinner
            const smallTimer = setTimeout(() => setShow(1), delay / 10);
            
            // Po delay pokaż pełny overlay
            const fullTimer = setTimeout(() => setShow(2), delay);
            
            return () => {
                clearTimeout(smallTimer);
                clearTimeout(fullTimer);
            };
        }
    }, [delay, mode]);

    useEffect(() => {
        if (show !== 2 || !timeDelaySec) return;
        const interval = setInterval(() => {
            const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
            if (secondsElapsed >= timeDelaySec) {
                setElapsedTime(secondsElapsed);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [show, timeDelaySec, startTime]);

    color = color ?? theme.palette.action.active;

    const [delays] = useState(() => getRandomDelays(4, -0.5, 0));

    return (
        <>
            {show === 1 && (
                <SmallSpinnerContainer>
                    <LoadingSpinner colors={spinnerColors} speed={1.2} size={24} borderWidth={3}>
                        <div />
                        <div />
                        <div />
                        <div />
                    </LoadingSpinner>
                </SmallSpinnerContainer>
            )}
            {show === 2 && (
                <Zoom in={true}>
                    <StyledLoadingOverlay labelPosition={labelPosition}>
                        <LoadingSpinner speed={speed} delays={delays} colors={spinnerColors} size={54} borderWidth={6}>
                            <div />
                            <div />
                            <div />
                            <div />
                        </LoadingSpinner>
                        {label && [
                            <LoadingLabel color={color} key="label">
                                <span>{label}</span>
                                {onCancelLoading !== undefined && (
                                    <Tooltip title={t("cancel", "Cancel")}>
                                        <ToolButton size="small" onClick={onCancelLoading}>
                                            <theme.icons.Close />
                                        </ToolButton>
                                    </Tooltip>
                                )}
                            </LoadingLabel>,
                            <LoadingLabel color={color} key="elapsed">
                                {elapsedTime !== null && " " + Duration.fromObject({ seconds: elapsedTime }).toFormat("hh:mm:ss")}
                            </LoadingLabel>
                        ]}
                    </StyledLoadingOverlay>
                </Zoom>
            )}
        </>
    );
};

export default LoadingOverlay;

