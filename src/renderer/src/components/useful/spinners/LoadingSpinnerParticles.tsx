import React from "react";

const LoadingSpinnerParticles: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => {
    // Generuj losowe pozycje startowe dla cząstek
    const particles = React.useMemo(() => Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 2 * Math.PI;
        const radius = 25 + Math.random() * 25; // większy zasięg
        return {
            id: i,
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle),
            color: colors[i % colors.length],
            delay: (i * 0.15).toFixed(1) + "s",
            duration: (2 + Math.random() * 1).toFixed(1) + "s",
        };
    }), [colors]);

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
            {/* Cząsteczki */}
            {particles.map((p) => (
                <circle key={p.id} r="4" fill={p.color}>
                    <animateMotion
                        dur={p.duration}
                        repeatCount="indefinite"
                        begin={p.delay}
                        path={`M ${p.x},${p.y} Q ${50 + (p.x - 50) * 1.8},${50 + (p.y - 50) * 1.8} 50,50 T ${p.x},${p.y}`}
                    />
                    <animate
                        attributeName="opacity"
                        values="0;1;1;0.5;0"
                        dur={p.duration}
                        begin={p.delay}
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="r"
                        values="2;5;2"
                        dur={p.duration}
                        begin={p.delay}
                        repeatCount="indefinite"
                    />
                </circle>
            ))}
        </svg>
    );
};

export default LoadingSpinnerParticles;