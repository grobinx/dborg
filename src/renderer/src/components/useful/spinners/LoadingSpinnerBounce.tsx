import { styled } from "@mui/material";

const LoadingSpinnerBounceStyled = styled("div")<{ colors: string[]; size?: number }>(({ colors, size = 54 }) => {
    const ballSize = size / 6;
    const gap = size / 10;

    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: `${gap}px`,
        "& div": {
            width: `${ballSize}px`,
            height: `${ballSize}px`,
            borderRadius: "50%",
            animation: "lds-bounce 1.4s ease-in-out infinite",
        },
        "& div:nth-of-type(1)": {
            background: colors[0],
            animationDelay: "0s",
        },
        "& div:nth-of-type(2)": {
            background: colors[1],
            animationDelay: "0.2s",
        },
        "& div:nth-of-type(3)": {
            background: colors[2],
            animationDelay: "0.4s",
        },
        "& div:nth-of-type(4)": {
            background: colors[3],
            animationDelay: "0.6s",
        },
        "@keyframes lds-bounce": {
            "0%, 80%, 100%": {
                transform: "translateY(0)",
            },
            "40%": {
                transform: `translateY(-${size * 0.5}px)`,
            },
        },
    };
});

function LoadingSpinnerBounce({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerBounceStyled colors={colors} size={size}>
            <div />
            <div />
            <div />
            <div />
        </LoadingSpinnerBounceStyled>
    );
}

export default LoadingSpinnerBounce;