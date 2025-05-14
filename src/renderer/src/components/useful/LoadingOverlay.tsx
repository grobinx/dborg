import { styled, Tooltip, useTheme, Zoom } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Duration } from "luxon";
import ToolButton from "../ToolButton";

const StyledLoadingOverlay = styled("div")<{ labelPosition: "below" | "side" }>(({ labelPosition }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: labelPosition === "below" ? "column" : "row", // Ustawienie kierunku
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: "6px", // Odstęp między spinnerem a tekstem
    backdropFilter: "blur(2px)", // Dodanie efektu rozmycia tła
}));

const generateRandomColor = () => {
    const randomColor = () => Math.floor(Math.random() * 256);
    return `rgb(${randomColor()}, ${randomColor()}, ${randomColor()})`;
};

const LoadingSpinner = styled("div")<{ speed: number }>(({ speed }) => {
    const color1 = generateRandomColor();
    const color2 = generateRandomColor();
    const color3 = generateRandomColor();
    const color4 = generateRandomColor();

    return {
        width: "50px",
        height: "50px",
        border: "5px solid rgba(0, 0, 0, 0)", // Tło wskaźnika
        borderTop: "5px solid transparent", // Początkowy kolor
        borderRadius: "50%",
        animation: `spin ${speed}s linear infinite, colorChange 4s linear infinite`, // Użycie właściwości speed
        "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
        },
        "@keyframes colorChange": {
            "0%": { borderTopColor: color1 }, // Losowy kolor 1
            "25%": { borderTopColor: color2 }, // Losowy kolor 2
            "50%": { borderTopColor: color3 }, // Losowy kolor 3
            "75%": { borderTopColor: color4 }, // Losowy kolor 4
            "100%": { borderTopColor: color1 }, // Powrót do losowego koloru 1
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
    const theme = useTheme(); // Pobierz motyw z kontekstu MUI
    const [show, setShow] = useState(false); // Stan do kontrolowania widoczności efektu
    const [elapsedTime, setElapsedTime] = useState<number | null>(null); // Stan do przechowywania upływającego czasu
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), delay); // Ustaw opóźnienie
        return () => clearTimeout(timer); // Wyczyść timer przy odmontowaniu komponentu
    }, [delay]);

    useEffect(() => {
        if (!show || !timeDelaySec) return; // Nie uruchamiaj licznika, jeśli efekt nie jest widoczny

        const startTime = Date.now();
        const interval = setInterval(() => {
            const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
            if (secondsElapsed >= timeDelaySec) {
                setElapsedTime(secondsElapsed); // Ustaw czas, który upłynął
            }
        }, 1000);

        return () => clearInterval(interval); // Wyczyść licznik przy odmontowaniu komponentu
    }, [show, timeDelaySec]);

    color = color ?? theme.palette.action.active;

    if (!show) return null; // Nie pokazuj efektu, jeśli opóźnienie jeszcze nie minęło

    return (
        <Zoom in={true}>
            <StyledLoadingOverlay labelPosition={labelPosition}>
                <LoadingSpinner speed={speed} />
                {label && [
                    <LoadingLabel color={color} key="label">
                        <span>{label}</span>
                        {onCancelLoading !== undefined && (
                            <Tooltip title={t("cancel", "Cancel")}>
                                <ToolButton onClick={onCancelLoading}>
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

