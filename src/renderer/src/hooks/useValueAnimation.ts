import React from "react";

/**
 * A custom hook that animates a value over a specified duration.
 * @param value The value to animate.
 * @param duration The duration of the animation in milliseconds.
 * @returns An array containing the animation state and the previous value.
 */
export const useValueAnimation = (value: any, duration = 300) => {
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [prevValue, setPrevValue] = React.useState(value);

    React.useEffect(() => {
        setIsAnimating(true);
        setPrevValue(value);

        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [value, duration]);

    return [isAnimating, prevValue];
};

export const animationScaleCss = {
    animation: 'valueChange 0.2s ease-out',
    '@keyframes valueChange': {
        '0%': {
            transform: 'scale(1)',
        },
        '50%': {
            transform: 'scale(1.1)',
        },
        '100%': {
            transform: 'scale(1)',
        },
    },
};

export const animationSlideDownCss = {
    animation: 'slideDown 0.2s ease-out',
    '@keyframes slideDown': {
        '0%': {
            transform: 'translateY(10px)',
            opacity: 0,
        },
        '100%': {
            transform: 'translateY(0)',
            opacity: 1,
        },
    },
};

export const animationFadeInCss = {
    animation: 'fadeIn 0.3s ease-out',
    '@keyframes fadeIn': {
        '0%': {
            opacity: 0,
        },
        '100%': {
            opacity: 1,
        },
    },
};

export const animationFadeOutCss = {
    animation: 'fadeOut 0.3s ease-out',
    '@keyframes fadeOut': {
        '0%': {
            opacity: 1,
        },
        '100%': {
            opacity: 0,
        },
    },
};

export const animationSlideUpCss = {
    animation: 'slideUp 0.2s ease-out',
    '@keyframes slideUp': {
        '0%': {
            transform: 'translateY(-10px)',
            opacity: 0,
        },
        '100%': {
            transform: 'translateY(0)',
            opacity: 1,
        },
    },
};

export const animationSlideLeftCss = {
    animation: 'slideLeft 0.2s ease-out',
    '@keyframes slideLeft': {
        '0%': {
            transform: 'translateX(10px)',
            opacity: 0,
        },
        '100%': {
            transform: 'translateX(0)',
            opacity: 1,
        },
    },
};

export const animationSlideRightCss = {
    animation: 'slideRight 0.2s ease-out',
    '@keyframes slideRight': {
        '0%': {
            transform: 'translateX(-10px)',
            opacity: 0,
        },
        '100%': {
            transform: 'translateX(0)',
            opacity: 1,
        },
    },
};

export const animationBounceCss = {
    animation: 'bounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    '@keyframes bounce': {
        '0%': {
            transform: 'scale(0.3)',
            opacity: 0,
        },
        '50%': {
            transform: 'scale(1.05)',
            opacity: 0.8,
        },
        '70%': {
            transform: 'scale(0.9)',
            opacity: 0.9,
        },
        '100%': {
            transform: 'scale(1)',
            opacity: 1,
        },
    },
};

export const animationPulseCss = {
    animation: 'pulse 0.4s ease-in-out',
    '@keyframes pulse': {
        '0%': {
            //transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(66, 165, 245, 0.7)',
        },
        '70%': {
            //transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(66, 165, 245, 0)',
        },
        '100%': {
            //transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(66, 165, 245, 0)',
        },
    },
};

export const animationFlipInCss = {
    animation: 'flipIn 0.4s ease-out',
    '@keyframes flipIn': {
        '0%': {
            transform: 'perspective(400px) rotateY(-90deg)',
            opacity: 0,
        },
        '40%': {
            transform: 'perspective(400px) rotateY(-10deg)',
        },
        '70%': {
            transform: 'perspective(400px) rotateY(10deg)',
        },
        '100%': {
            transform: 'perspective(400px) rotateY(0deg)',
            opacity: 1,
        },
    },
};

export const animationZoomInCss = {
    animation: 'zoomIn 0.3s ease-out',
    '@keyframes zoomIn': {
        '0%': {
            transform: 'scale3d(0.8, 0.8, 0.8)',
            opacity: 0,
        },
        '50%': {
            opacity: 1,
        },
        '100%': {
            transform: 'scale3d(1, 1, 1)',
            opacity: 1,
        },
    },
};

export const animationShakeCss = {
    animation: 'shake 0.5s ease-in-out',
    '@keyframes shake': {
        '0%, 100%': {
            transform: 'translateX(0)',
        },
        '10%, 30%, 50%, 70%, 90%': {
            transform: 'translateX(-5px)',
        },
        '20%, 40%, 60%, 80%': {
            transform: 'translateX(5px)',
        },
    },
};

export const animationGlowCss = {
    animation: 'glow 0.4s ease-in-out',
    '@keyframes glow': {
        '0%': {
            boxShadow: '0 0 5px rgba(66, 165, 245, 0.5)',
        },
        '50%': {
            boxShadow: '0 0 20px rgba(66, 165, 245, 0.8), 0 0 30px rgba(66, 165, 245, 0.6)',
        },
        '100%': {
            boxShadow: '0 0 5px rgba(66, 165, 245, 0.5)',
        },
    },
};

export const animationRotateInCss = {
    animation: 'rotateIn 0.4s ease-out',
    '@keyframes rotateIn': {
        '0%': {
            transform: 'rotate(-200deg)',
            opacity: 0,
        },
        '100%': {
            transform: 'rotate(0)',
            opacity: 1,
        },
    },
};

export const animationSlideInFromTopCss = {
    animation: 'slideInFromTop 0.3s ease-out',
    '@keyframes slideInFromTop': {
        '0%': {
            transform: 'translateY(-100%)',
            opacity: 0,
        },
        '100%': {
            transform: 'translateY(0)',
            opacity: 1,
        },
    },
};

export const animationFlipXCss = {
    animation: 'flipX 0.4s ease-in-out',
    '@keyframes flipX': {
        '0%': {
            transform: 'perspective(400px) rotateX(-90deg)',
            opacity: 0,
        },
        '40%': {
            transform: 'perspective(400px) rotateX(-10deg)',
        },
        '70%': {
            transform: 'perspective(400px) rotateX(10deg)',
        },
        '100%': {
            transform: 'perspective(400px) rotateX(0deg)',
            opacity: 1,
        },
    },
};

export const animationWobbleCss = {
    animation: 'wobble 0.6s ease-in-out',
    '@keyframes wobble': {
        '0%': {
            transform: 'translateX(0%)',
        },
        '15%': {
            transform: 'translateX(-25%) rotate(-5deg)',
        },
        '30%': {
            transform: 'translateX(20%) rotate(3deg)',
        },
        '45%': {
            transform: 'translateX(-15%) rotate(-3deg)',
        },
        '60%': {
            transform: 'translateX(10%) rotate(2deg)',
        },
        '75%': {
            transform: 'translateX(-5%) rotate(-1deg)',
        },
        '100%': {
            transform: 'translateX(0%)',
        },
    },
};

export const animationHeartBeatCss = {
    animation: 'heartBeat 1s ease-in-out infinite',
    '@keyframes heartBeat': {
        '0%': {
            transform: 'scale(1)',
        },
        '14%': {
            transform: 'scale(1.3)',
        },
        '28%': {
            transform: 'scale(1)',
        },
        '42%': {
            transform: 'scale(1.3)',
        },
        '70%': {
            transform: 'scale(1)',
        },
    },
};

export const animationRubberBandCss = {
    animation: 'rubberBand 0.6s ease-out',
    '@keyframes rubberBand': {
        '0%': {
            transform: 'scale3d(1, 1, 1)',
        },
        '30%': {
            transform: 'scale3d(1.25, 0.75, 1)',
        },
        '40%': {
            transform: 'scale3d(0.75, 1.25, 1)',
        },
        '50%': {
            transform: 'scale3d(1.15, 0.85, 1)',
        },
        '65%': {
            transform: 'scale3d(0.95, 1.05, 1)',
        },
        '75%': {
            transform: 'scale3d(1.05, 0.95, 1)',
        },
        '100%': {
            transform: 'scale3d(1, 1, 1)',
        },
    },
};

export const animationFlashCss = {
    animation: 'flash 0.3s ease-in-out',
    '@keyframes flash': {
        '0%, 50%, 100%': {
            opacity: 1,
        },
        '25%, 75%': {
            opacity: 0,
        },
    },
};

export default useValueAnimation;