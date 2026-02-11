import { styled } from "@mui/material";

const LoadingSpinnerCubeStyled = styled("div")<{ colors: string[]; size?: number }>(({ colors, size = 54 }) => {
    const cubeSize = size * 0.6;
    
    return {
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "800px",
        "& .cube": {
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            position: "relative",
            transformStyle: "preserve-3d",
            animation: "lds-cube-rotate 3s infinite ease-in-out",
        },
        "& .cube__face": {
            position: "absolute",
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            border: "2px solid rgba(255,255,255,0.3)",
            opacity: 0.9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${cubeSize / 3}px`,
            fontWeight: "bold",
            color: "rgba(255,255,255,0.8)",
        },
        "& .cube__face--front": {
            background: colors[0],
            transform: `rotateY(0deg) translateZ(${cubeSize / 2}px)`,
        },
        "& .cube__face--back": {
            background: colors[1],
            transform: `rotateY(180deg) translateZ(${cubeSize / 2}px)`,
        },
        "& .cube__face--right": {
            background: colors[2],
            transform: `rotateY(90deg) translateZ(${cubeSize / 2}px)`,
        },
        "& .cube__face--left": {
            background: colors[3],
            transform: `rotateY(-90deg) translateZ(${cubeSize / 2}px)`,
        },
        "& .cube__face--top": {
            background: colors[0],
            transform: `rotateX(90deg) translateZ(${cubeSize / 2}px)`,
        },
        "& .cube__face--bottom": {
            background: colors[1],
            transform: `rotateX(-90deg) translateZ(${cubeSize / 2}px)`,
        },
        "@keyframes lds-cube-rotate": {
            "0%": {
                transform: "rotateX(0deg) rotateY(0deg)",
            },
            "25%": {
                transform: "rotateX(180deg) rotateY(90deg)",
            },
            "50%": {
                transform: "rotateX(180deg) rotateY(180deg)",
            },
            "75%": {
                transform: "rotateX(270deg) rotateY(270deg)",
            },
            "100%": {
                transform: "rotateX(360deg) rotateY(360deg)",
            },
        },
    };
});

function LoadingSpinnerCube({ colors, size }: { colors: string[]; size?: number }) {
    return (
        <LoadingSpinnerCubeStyled colors={colors} size={size}>
            <div className="cube">
                <div className="cube__face cube__face--front"></div>
                <div className="cube__face cube__face--back"></div>
                <div className="cube__face cube__face--right"></div>
                <div className="cube__face cube__face--left"></div>
                <div className="cube__face cube__face--top"></div>
                <div className="cube__face cube__face--bottom"></div>
            </div>
        </LoadingSpinnerCubeStyled>
    );
}

export default LoadingSpinnerCube;