import { styled } from "@mui/material";

const LoadingSpinnerFlipStyled = styled("div")<{ colors: string[]; size?: number }>(({ colors, size = 54 }) => {
    const cardSize = size / 3;
    const gap = size / 15;
    
    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${gap}px`,
        perspective: "500px",
        "& div": {
            width: `${cardSize}px`,
            height: `${cardSize}px`,
            borderRadius: `${cardSize / 8}px`,
            transformStyle: "preserve-3d",
            animation: "lds-flip 2s ease-in-out infinite",
        },
        "& div:nth-of-type(1)": {
            background: colors[0],
            animationDelay: "0s",
        },
        "& div:nth-of-type(2)": {
            background: colors[1],
            animationDelay: "0.3s",
        },
        "& div:nth-of-type(3)": {
            background: colors[2],
            animationDelay: "0.6s",
        },
        "& div:nth-of-type(4)": {
            background: colors[3],
            animationDelay: "0.9s",
        },
        "@keyframes lds-flip": {
            "0%, 80%, 100%": {
                transform: "rotateY(0deg)",
            },
            "40%": {
                transform: "rotateY(180deg)",
            },
        },
    };
});

function LoadingSpinnerFlip({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerFlipStyled colors={colors} size={size}>
            <div />
            <div />
            <div />
            <div />
        </LoadingSpinnerFlipStyled>
    );
}

export default LoadingSpinnerFlip;