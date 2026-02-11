import { styled } from "@mui/material";

const LoadingSpinnerGridStyled = styled("div")<{ colors: string[]; size?: number }>(({ colors, size = 54 }) => {
    const cellSize = size / 4;
    const gap = size / 12;
    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "grid",
        gridTemplateColumns: `repeat(3, ${cellSize}px)`,
        gridTemplateRows: `repeat(3, ${cellSize}px)`,
        gap: `${gap}px`,
        "& div": {
            background: colors[0],
            animation: "lds-grid 1.2s linear infinite, lds-grid-spin 3s ease-in-out infinite",
        },
        "& div:nth-of-type(1)": { 
            animationDelay: "0s, 0s", 
            background: colors[0] 
        },
        "& div:nth-of-type(2)": { 
            animationDelay: "-0.4s, 0.5s", 
            background: colors[1] 
        },
        "& div:nth-of-type(3)": { 
            animationDelay: "-0.8s, 1s", 
            background: colors[2] 
        },
        "& div:nth-of-type(4)": { 
            animationDelay: "-0.4s, 1.5s", 
            background: colors[1] 
        },
        "& div:nth-of-type(5)": { 
            animationDelay: "-0.8s, 2s", 
            background: colors[2] 
        },
        "& div:nth-of-type(6)": { 
            animationDelay: "-1.2s, 2.5s", 
            background: colors[3] 
        },
        "& div:nth-of-type(7)": { 
            animationDelay: "-0.8s, 0.3s", 
            background: colors[2] 
        },
        "& div:nth-of-type(8)": { 
            animationDelay: "-1.2s, 0.8s", 
            background: colors[3] 
        },
        "& div:nth-of-type(9)": { 
            animationDelay: "-1.6s, 1.3s", 
            background: colors[0] 
        },
        "@keyframes lds-grid": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.3 },
        },
        "@keyframes lds-grid-spin": {
            "0%, 90%": { transform: "rotate(0deg)" },
            "95%": { transform: "rotate(180deg)" },
            "100%": { transform: "rotate(360deg)" },
        },
    };
});

function LoadingSpinnerGrid({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerGridStyled colors={colors} size={size}>
            <div /><div /><div /><div /><div /><div /><div /><div /><div />
        </LoadingSpinnerGridStyled>
    );
}

export default LoadingSpinnerGrid;