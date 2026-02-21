import { Box, styled, useTheme, Zoom } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Duration } from "luxon";
import Tooltip from "../Tooltip";
import { ToolButton } from "../buttons/ToolButton";
import LoadingSpinnerRing from "./spinners/LoadingSpinnerRing";
import LoadingSpinnerDots from "./spinners/LoadingSpinnerDots";
import LoadingSpinnerBars from "./spinners/LoadingSpinnerBars";
import LoadingSpinnerOrbit from "./spinners/LoadingSpinnerOrbit";
import LoadingSpinnerPulse from "./spinners/LoadingSpinnerPulse";
import LoadingSpinnerGrid from "./spinners/LoadingSpinnerGrid";
import LoadingSpinnerWave from "./spinners/LoadingSpinnerWave";
import LoadingSpinnerHexagon from "./spinners/LoadingSpinnerHexagon";
import LoadingSpinnerBounce from "./spinners/LoadingSpinnerBounce";
import LoadingSpinnerRipple from "./spinners/LoadingSpinnerRipple";
import LoadingSpinnerGears from "./spinners/LoadingSpinnerGears";
import LoadingSpinnerFlip from "./spinners/LoadingSpinnerFlip";
import LoadingSpinnerCube from "./spinners/LoadingSpinnerCube";
import LoadingSpinnerParticles from "./spinners/LoadingSpinnerParticles";
import LoadingSpinnerInfinity from "./spinners/LoadingSpinnerInfinity";
import LoadingSpinnerClock from "./spinners/LoadingSpinnerClock";
import { LoadingOverlayMode, shuffleArray, SPINNER_TYPES, spinnerColorsDark, spinnerColorsLight, SpinnerType } from "./spinners/Spinners";
import { useSetting } from "@renderer/contexts/SettingsContext";

// ========== Reszta komponentu ==========
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
    labelPosition?: "below" | "side";
    timeDelaySec?: number;
    onCancelLoading?: () => void;
    mode?: LoadingOverlayMode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    label,
    color,
    delay = 1000,
    labelPosition = "below",
    timeDelaySec = 10,
    onCancelLoading,
    mode = "auto",
}) => {
    const theme = useTheme();
    const [show, setShow] = useState<0 | 1 | 2>(0);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime] = useState(Date.now());
    const { t } = useTranslation();
    const [spinnerTypeSetting] = useSetting<SpinnerType>("ui", "loading-overlay-spinner-type");

    const [spinnerColors, setSpinnerColors] = useState(() =>
        theme.palette.mode === "dark"
            ? shuffleArray(spinnerColorsDark)
            : shuffleArray(spinnerColorsLight)
    );

    // Losowy wybór spinnera przy montowaniu
    const [spinnerType] = useState<SpinnerType>(() =>
        spinnerTypeSetting === "random"
            ? SPINNER_TYPES[Math.floor(Math.random() * SPINNER_TYPES.length)]
            : spinnerTypeSetting
    );

    useEffect(() => {
        setSpinnerColors(
            theme.palette.mode === "dark"
                ? shuffleArray(spinnerColorsDark)
                : shuffleArray(spinnerColorsLight)
        );
    }, [theme.palette.mode]);

    useEffect(() => {
        if (mode === "small") {
            const smallTimer = setTimeout(() => setShow(1), delay / 10);
            return () => {
                clearTimeout(smallTimer);
            };
        } else if (mode === "full") {
            const fullTimer = setTimeout(() => setShow(2), delay / 10);
            return () => {
                clearTimeout(fullTimer);
            };
        } else {
            const smallTimer = setTimeout(() => setShow(1), delay / 10);
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

    const renderSpinner = (size: number) => {
        const spinnerKey = `${spinnerType}-${size}`; // Unikalny klucz dla każdego rozmiaru
        
        switch (spinnerType) {
            case "ring": return <LoadingSpinnerRing key={spinnerKey} colors={spinnerColors} size={size} />;
            case "dots": return <LoadingSpinnerDots key={spinnerKey} colors={spinnerColors} size={size} />;
            case "bars": return <LoadingSpinnerBars key={spinnerKey} colors={spinnerColors} size={size} />;
            case "pulse": return <LoadingSpinnerPulse key={spinnerKey} colors={spinnerColors} size={size} />;
            case "grid": return <LoadingSpinnerGrid key={spinnerKey} colors={spinnerColors} size={size} />;
            case "orbit": return <LoadingSpinnerOrbit key={spinnerKey} colors={spinnerColors} size={size} />;
            case "wave": return <LoadingSpinnerWave key={spinnerKey} colors={spinnerColors} size={size} />;
            case "hexagon": return <LoadingSpinnerHexagon key={spinnerKey} colors={spinnerColors} size={size} />;
            case "bounce": return <LoadingSpinnerBounce key={spinnerKey} colors={spinnerColors} size={size} />;
            case "ripple": return <LoadingSpinnerRipple key={spinnerKey} colors={spinnerColors} size={size} />;
            case "gears": return <LoadingSpinnerGears key={spinnerKey} colors={spinnerColors} size={size} />;
            case "flip": return <LoadingSpinnerFlip key={spinnerKey} colors={spinnerColors} size={size} />;
            case "cube": return <LoadingSpinnerCube key={spinnerKey} colors={spinnerColors} size={size} />;
            case "particles": return <LoadingSpinnerParticles key={spinnerKey} colors={spinnerColors} size={size} />;
            case "infinity": return <LoadingSpinnerInfinity key={spinnerKey} colors={spinnerColors} size={size} />;
            case "clock": return <LoadingSpinnerClock key={spinnerKey} colors={spinnerColors} size={size} />;
        }
    };

    return (
        <>
            {show === 1 && (
                <SmallSpinnerContainer>
                    {renderSpinner(24)}
                </SmallSpinnerContainer>
            )}
            {show === 2 && (
                <Zoom in={true}>
                    <StyledLoadingOverlay labelPosition={labelPosition}>
                        {renderSpinner(54)}
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

