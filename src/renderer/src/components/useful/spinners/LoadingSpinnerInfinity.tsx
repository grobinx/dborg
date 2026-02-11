import React from "react";

const LoadingSpinnerInfinity: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        <defs>
            <linearGradient id="infinity-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors[0]} />
                <stop offset="50%" stopColor={colors[2]} />
                <stop offset="100%" stopColor={colors[3]} />
            </linearGradient>
        </defs>
        
        {/* Symbol nieskończoności (∞) - powiększony */}
        <path
            d="M 20,50 C 20,30 30,30 50,50 C 70,70 80,70 80,50 C 80,30 70,30 50,50 C 30,70 20,70 20,50 Z"
            fill="none"
            stroke="url(#infinity-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="2s"
                repeatCount="indefinite"
            />
            <animate
                attributeName="stroke-width"
                values="6;7;6"
                dur="2s"
                repeatCount="indefinite"
            />
        </path>

        {/* Kulka 1 - porusza się po ósemce */}
        <circle r="7" fill={colors[1]}>
            <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path="M 20,50 C 20,30 30,30 50,50 C 70,70 80,70 80,50 C 80,30 70,30 50,50 C 30,70 20,70 20,50"
            />
            <animate
                attributeName="fill"
                values={`${colors[0]};${colors[1]};${colors[2]};${colors[3]};${colors[0]}`}
                dur="4s"
                repeatCount="indefinite"
            />
        </circle>

        {/* Kulka 2 - przeciwny kierunek, mniejsza */}
        <circle r="5.5" fill={colors[3]} opacity="0.8">
            <animateMotion
                dur="4s"
                repeatCount="indefinite"
                begin="2s"
                path="M 20,50 C 20,30 30,30 50,50 C 70,70 80,70 80,50 C 80,30 70,30 50,50 C 30,70 20,70 20,50"
            />
            <animate
                attributeName="fill"
                values={`${colors[3]};${colors[2]};${colors[1]};${colors[0]};${colors[3]}`}
                dur="4s"
                repeatCount="indefinite"
                begin="2s"
            />
        </circle>
    </svg>
);

export default LoadingSpinnerInfinity;