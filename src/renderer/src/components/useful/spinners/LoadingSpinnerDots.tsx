import { styled } from "@mui/material";

const LoadingSpinnerDotsStyled = styled("div")<{ colors: string[]; size?: number }>(({ colors, size = 54 }) => {
    const dotSize = size / 5;
    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-block",
        position: "relative",
        "& div": {
            position: "absolute",
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            borderRadius: "50%",
            background: colors[0],
            animationTimingFunction: "cubic-bezier(0, 1, 1, 0)",
        },
        "& div:nth-of-type(1)": {
            left: `${size * 0.1}px`,
            animation: "lds-ellipsis1 0.6s infinite",
            background: colors[0],
        },
        "& div:nth-of-type(2)": {
            left: `${size * 0.1}px`,
            animation: "lds-ellipsis2 0.6s infinite",
            background: colors[1],
        },
        "& div:nth-of-type(3)": {
            left: `${size * 0.4}px`,
            animation: "lds-ellipsis2 0.6s infinite",
            background: colors[2],
        },
        "& div:nth-of-type(4)": {
            left: `${size * 0.7}px`,
            animation: "lds-ellipsis3 0.6s infinite",
            background: colors[3],
        },
        "@keyframes lds-ellipsis1": {
            "0%": { transform: "scale(0)" },
            "100%": { transform: "scale(1)" },
        },
        "@keyframes lds-ellipsis2": {
            "0%": { transform: "translate(0, 0)" },
            "100%": { transform: `translate(${size * 0.3}px, 0)` },
        },
        "@keyframes lds-ellipsis3": {
            "0%": { transform: "scale(1)" },
            "100%": { transform: "scale(0)" },
        },
    };
});

function LoadingSpinnerDots({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerDotsStyled colors={colors} size={size}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </LoadingSpinnerDotsStyled>
    );
}

export default LoadingSpinnerDots;