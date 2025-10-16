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

const LoadingSpinner = styled("div")<{ speed: number; delays?: string[]; colors: string[] }>(({ speed, delays, colors }) => {
    return {
        width: "54px",
        height: "54px",
        display: "inline-block",
        position: "relative",
        "& div": {
            boxSizing: "border-box",
            display: "block",
            position: "absolute",
            width: "54px",
            height: "54px",
            border: "6px solid",
            borderColor: `${colors[0]} transparent transparent transparent`,
            borderRadius: "50%",
            animation: `lds-ring-spin ${speed}s cubic-bezier(0.5, 0, 0.5, 1) infinite`,
            borderWidth: "6px",
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
    color: color, // Kolor tekstu
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
            ? "rgba(38, 50, 56, 0.6)" // ciemny paper z przezroczystością
            : "rgba(255, 255, 255, 0.6)", // jasny paper z przezroczystością
}));

interface LoadingOverlayProps {
    /**
     * Opcjonalny tekst do wyświetlenia obok spinnera.
     * @default undefined
     */
    label?: string;
    /**
     * Opcjonalny kolor tekstu.
     * @default theme.palette.action.active
     */
    color?: string;
    /**
     * Opcjonalne opóźnienie w milisekundach przed pokazaniem efektu ładowania.
     * @default 1000
     */
    delay?: number;
    /**
     * Opcjonalna szybkość obracania się spinnera w sekundach.
     * @default 1 sekunda
     */
    speed?: number;
    /**
     * Opcjonalna pozycja tekstu względem spinnera.
     * @default "below"
     */
    labelPosition?: "below" | "side";
    /**
     * Opcjonalny opóźnienie po którym pokaże się czas który upłynął od momentu rozpoczęcia ładowania
     */
    timeDelaySec?: number;

    /**
     * Opcjonalna funkcja do anulowania ładowania.
     */
    onCancelLoading?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    label,
    color,
    delay = 1000,
    speed = 1,
    labelPosition = "below",
    timeDelaySec = 10,
    onCancelLoading,
}) => {
    const theme = useTheme();
    const [show, setShow] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime] = useState(Date.now());
    const { t } = useTranslation();

    // Losuj kolory spinnera przy każdym montowaniu
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
        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    useEffect(() => {
        if (!show || !timeDelaySec) return;
        const interval = setInterval(() => {
            const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
            if (secondsElapsed >= timeDelaySec) {
                setElapsedTime(secondsElapsed);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [show, timeDelaySec, startTime]);

    color = color ?? theme.palette.action.active;

    // Generuj losowe opóźnienia tylko raz na montowanie
    const [delays] = useState(() => getRandomDelays(4, -0.5, 0));

    if (!show) return null;

    return (
        <Zoom in={true}>
            <StyledLoadingOverlay labelPosition={labelPosition}>
                <LoadingSpinner speed={speed} delays={delays} colors={spinnerColors}>
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
    );
};

export default LoadingOverlay;

