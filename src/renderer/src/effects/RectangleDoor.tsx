import { darken, lighten, styled, keyframes } from "@mui/material";
import React from "react";

const generateColorScale = (baseColor: string, count: number) => {
    if (count <= 1) return [baseColor];

    const mid = Math.floor(count / 2);
    const leftMax = mid;
    const rightMax = count - mid - 1;
    const maxDelta = 0.3;

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        const dist = i - mid;
        if (dist === 0) {
            colors.push(baseColor);
        } else if (dist < 0) {
            const t = Math.abs(dist) / (leftMax || 1);
            colors.push(lighten(baseColor, t * maxDelta));
        } else {
            const t = dist / (rightMax || 1);
            colors.push(darken(baseColor, t * maxDelta));
        }
    }
    return colors;
};

interface Rectangle {
    width: number; // w %
    height: number; // w %
    color: string;
}

const generateRectangles = (
    rectangleCount: number,
    baseColor: string,
    minWidthPercent: number = 5,
    maxWidthPercent: number = 15
): Rectangle[] => {
    const colors = generateColorScale(baseColor, rectangleCount);
    const rectangles: Rectangle[] = [];
    const heightPercent = 100 / rectangleCount;

    for (let i = 0; i < rectangleCount; i++) {
        const randomWidth = Math.random() * (maxWidthPercent - minWidthPercent) + minWidthPercent;
        
        rectangles.push({
            width: randomWidth,
            height: heightPercent,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    return rectangles;
};

interface RectangleDoorProps {
    rectangleCount?: number;
    baseColor?: string;
    minWidthPercent?: number;
    maxWidthPercent?: number;
    duration?: number;
    isOpen?: boolean;
    onAnimationEnd?: () => void;
    className?: string;
}

const StyledDoorContainer = styled('div')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9999,
    overflow: 'hidden',
});

const StyledDoorPanel = styled('div')<{ $side: 'left' | 'right' }>(({ $side }) => ({
    position: 'absolute',
    top: 0,
    [$side]: 0,
    width: '50%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
}));

// Animacja dla lewych prostokątów - prawa krawędź się porusza (rozszerza w prawo)
const breatheLeft = keyframes`
    0%, 100% {
        transform: scaleX(1);
    }
    50% {
        transform: scaleX(1.2);
    }
`;

// Animacja dla prawych prostokątów - lewa krawędź się porusza (rozszerza w lewo)
const breatheRight = keyframes`
    0%, 100% {
        transform: scaleX(1);
    }
    50% {
        transform: scaleX(1.2);
    }
`;

const StyledRectangle = styled('div')<{
    $isOpen: boolean;
    $side: 'left' | 'right';
    $openWidth: number;
    $duration: number;
    $color: string;
    $height: number;
    $index: number;
    $totalCount: number;
}>(({ $isOpen, $side, $openWidth, $duration, $color, $height, $index, $totalCount }) => {
    const normalizedPosition = $index / $totalCount;
    const centerDistance = Math.abs(normalizedPosition - 0.5) * 2;
    
    const delay = (1 - centerDistance) * $duration * 0.3;
    const adjustedDuration = $duration * (0.5 + centerDistance * 0.5);

    // Różne czasy dla animacji "oddychania" każdego prostokąta
    const breatheDuration = 2 + ($index % 4) * 0.5; // 2-3.5 sekund
    const breatheDelay = $index * 0.15; // Opóźnienie między prostokątami

    return {
        position: 'relative',
        height: `${$height}%`,
        backgroundColor: $color,
        flexShrink: 0,
        
        // Efekt panelu drzwi
        backgroundImage: `
            linear-gradient(to ${$side === 'left' ? 'right' : 'left'}, 
                ${darken($color, 0.3)} 0%, 
                ${lighten($color, 0.05)} 5%, 
                ${$color} 20%, 
                ${lighten($color, 0.1)} 50%,
                ${$color} 80%,
                ${lighten($color, 0.05)} 95%,
                ${darken($color, 0.3)} 100%
            )
        `,
        
        // Wyraźniejsze cienie dla efektu 3D
        boxShadow: $side === 'left' 
            ? `
                3px 0 12px rgba(0, 0, 0, 0.4),
                inset -3px 0 6px rgba(0, 0, 0, 0.3),
                inset 1px 0 2px rgba(255, 255, 255, 0.1)
            `
            : `
                -3px 0 12px rgba(0, 0, 0, 0.4),
                inset 3px 0 6px rgba(0, 0, 0, 0.3),
                inset -1px 0 2px rgba(255, 255, 255, 0.1)
            `,
        
        // Ramka panelu
        border: `1px solid ${darken($color, 0.4)}`,
        borderLeft: $side === 'right' ? `2px solid ${darken($color, 0.5)}` : undefined,
        borderRight: $side === 'left' ? `2px solid ${darken($color, 0.5)}` : undefined,
        
        // Tekstura drewna
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
                repeating-linear-gradient(
                    ${$side === 'left' ? '90deg' : '-90deg'},
                    transparent,
                    transparent 3px,
                    rgba(0, 0, 0, 0.05) 3px,
                    rgba(0, 0, 0, 0.05) 6px
                )
            `,
            opacity: 0.6,
            pointerEvents: 'none',
        },
        
        // Highlight na krawędzi
        '&::after': {
            content: '""',
            position: 'absolute',
            top: '10%',
            bottom: '10%',
            [$side === 'left' ? 'right' : 'left']: 0,
            width: '2px',
            background: `linear-gradient(to bottom, 
                transparent, 
                rgba(255, 255, 255, 0.2) 50%, 
                transparent
            )`,
            pointerEvents: 'none',
        },
        
        // Podstawowa szerokość i transition dla otwierania/zamykania
        width: $isOpen ? `${$openWidth}%` : '100%',
        transition: `width ${adjustedDuration}ms ease-in-out ${delay}ms`,
        
        // Transform origin - ważne dla animacji
        transformOrigin: $side === 'left' ? 'left center' : 'right center',
        
        // Wyrównaj prostokąty do krawędzi
        ...($side === 'left' && {
            marginLeft: 0,
            marginRight: 'auto',
        }),
        ...($side === 'right' && {
            marginLeft: 'auto',
            marginRight: 0,
        }),

        // Animacja "oddychania" tylko gdy drzwi są otwarte
        ...($isOpen && {
            animation: `${$side === 'left' ? breatheLeft : breatheRight} ${breatheDuration}s ease-in-out ${breatheDelay}s infinite`,
        }),
    };
});

const RectangleDoor: React.FC<RectangleDoorProps> = ({
    rectangleCount = 8,
    baseColor = '#b62d41',
    minWidthPercent = 5,
    maxWidthPercent = 15,
    duration = 300,
    isOpen = false,
    onAnimationEnd,
    className,
}) => {
    const [leftRectangles, rightRectangles] = React.useMemo(() => {
        const left = generateRectangles(rectangleCount, baseColor, minWidthPercent, maxWidthPercent);
        const right = generateRectangles(rectangleCount, baseColor, minWidthPercent, maxWidthPercent);
        return [left, right];
    }, [rectangleCount, baseColor, minWidthPercent, maxWidthPercent]);

    React.useEffect(() => {
        if (onAnimationEnd) {
            const maxDelay = duration * 0.3;
            const maxDuration = duration;
            const totalTime = maxDelay + maxDuration;
            
            const timer = setTimeout(onAnimationEnd, totalTime);
            return () => clearTimeout(timer);
        }
        return;
    }, [isOpen, duration, onAnimationEnd]);

    return (
        <StyledDoorContainer className={className}>
            {/* Lewa strona */}
            <StyledDoorPanel $side="left">
                {leftRectangles.map((rect, i) => (
                    <StyledRectangle
                        key={`left-${i}`}
                        $isOpen={isOpen}
                        $side="left"
                        $openWidth={rect.width}
                        $duration={duration}
                        $color={rect.color}
                        $height={rect.height}
                        $index={i}
                        $totalCount={rectangleCount}
                    />
                ))}
            </StyledDoorPanel>

            {/* Prawa strona */}
            <StyledDoorPanel $side="right">
                {rightRectangles.map((rect, i) => (
                    <StyledRectangle
                        key={`right-${i}`}
                        $isOpen={isOpen}
                        $side="right"
                        $openWidth={rect.width}
                        $duration={duration}
                        $color={rect.color}
                        $height={rect.height}
                        $index={i}
                        $totalCount={rectangleCount}
                    />
                ))}
            </StyledDoorPanel>
        </StyledDoorContainer>
    );
};

export default RectangleDoor;