import React from "react";

const LoadingSpinnerClock: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        {/* Tarcza zegara */}
        <circle cx="50" cy="50" r="35" fill="none" stroke={colors[0]} strokeWidth="3" />
        
        {/* Znaczniki godzin */}
        {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 50 + 30 * Math.cos(angle);
            const y1 = 50 + 30 * Math.sin(angle);
            const x2 = 50 + 35 * Math.cos(angle);
            const y2 = 50 + 35 * Math.sin(angle);
            return (
                <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={colors[1]}
                    strokeWidth={i % 3 === 0 ? "2" : "1"}
                    opacity="0.6"
                />
            );
        })}

        {/* Wskazówka minutowa */}
        <line x1="50" y1="50" x2="50" y2="20" stroke={colors[2]} strokeWidth="3" strokeLinecap="round">
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="3s"
                repeatCount="indefinite"
            />
        </line>

        {/* Wskazówka godzinowa */}
        <line x1="50" y1="50" x2="50" y2="30" stroke={colors[3]} strokeWidth="4" strokeLinecap="round">
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="12s"
                repeatCount="indefinite"
            />
        </line>

        {/* Wskazówka sekundowa (szybka) */}
        <line x1="50" y1="50" x2="50" y2="15" stroke={colors[0]} strokeWidth="1.5" strokeLinecap="round">
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="1s"
                repeatCount="indefinite"
            />
        </line>

        {/* Środek zegara */}
        <circle cx="50" cy="50" r="4" fill={colors[2]} />
    </svg>
);

export default LoadingSpinnerClock;