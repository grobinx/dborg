import { styled } from "@mui/material";

const LoadingSpinnerWaveStyled = styled("div")<{ colors: string[]; size?: number }>(({ colors, size = 54 }) => {
    const barCount = 5;
    const barWidth = size / (barCount * 2);
    const gap = barWidth * 0.5;

    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${gap}px`,
        "& div": {
            width: `${barWidth}px`,
            height: `${size * 0.8}px`,
            borderRadius: `${barWidth / 2}px`,
            animation: "lds-wave 1s ease-in-out infinite",
        },
        "& div:nth-of-type(1)": {
            background: colors[0],
            animationDelay: "0s",
        },
        "& div:nth-of-type(2)": {
            background: colors[1],
            animationDelay: "0.1s",
        },
        "& div:nth-of-type(3)": {
            background: colors[2],
            animationDelay: "0.2s",
        },
        "& div:nth-of-type(4)": {
            background: colors[3],
            animationDelay: "0.3s",
        },
        "& div:nth-of-type(5)": {
            background: colors[0],
            animationDelay: "0.4s",
        },
        "@keyframes lds-wave": {
            "0%, 100%": {
                transform: "scaleY(0.4)",
            },
            "50%": {
                transform: "scaleY(1)",
            },
        },
    };
});

function LoadingSpinnerWave({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerWaveStyled colors={colors} size={size}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </LoadingSpinnerWaveStyled>
    );
}

export default LoadingSpinnerWave;