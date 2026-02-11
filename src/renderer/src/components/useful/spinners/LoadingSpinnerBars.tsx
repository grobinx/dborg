import { styled } from "@mui/material";

const LoadingSpinnerBarsStyled = styled("div")<{ colors: string[]; size?: number }>(({ colors, size = 54 }) => {
    const barWidth = size / 8;
    const gap = size / 12;
    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${gap}px`,
        "& div": {
            width: `${barWidth}px`,
            height: `${size * 0.6}px`,
            animation: "lds-bars 1.2s cubic-bezier(0, 0.5, 0.5, 1) infinite",
        },
        "& div:nth-of-type(1)": {
            background: colors[0],
            animationDelay: "-0.24s",
        },
        "& div:nth-of-type(2)": {
            background: colors[1],
            animationDelay: "-0.12s",
        },
        "& div:nth-of-type(3)": {
            background: colors[2],
            animationDelay: "0s",
        },
        "@keyframes lds-bars": {
            "0%, 80%, 100%": { height: `${size * 0.2}px` },
            "40%": { height: `${size * 0.6}px` },
        },
    };
});

function LoadingSpinnerBars({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerBarsStyled colors={colors} size={size}>
            <div></div>
            <div></div>
            <div></div>
        </LoadingSpinnerBarsStyled>
    );
}

export default LoadingSpinnerBars;