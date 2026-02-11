import React from "react";

const LoadingSpinnerGears: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => {
    // Generator ścieżki zębatki (uproszczony)
    const gearPath = (cx: number, cy: number, r: number, teeth: number) => {
        const points: string[] = [];
        const toothHeight = r * 0.15;
        const angleStep = (2 * Math.PI) / (teeth * 2);
        
        for (let i = 0; i < teeth * 2; i++) {
            const angle = i * angleStep;
            const radius = i % 2 === 0 ? r : r + toothHeight;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`);
        }
        points.push('Z');
        return points.join(' ');
    };

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
            {/* Zębatka 1 (duża, lewa) */}
            <g>
                <path 
                    d={gearPath(35, 50, 20, 8)} 
                    fill={colors[0]} 
                    stroke={colors[1]} 
                    strokeWidth="1"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 35 50"
                        to="360 35 50"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </path>
                <circle cx="35" cy="50" r="8" fill={colors[3]} opacity="0.5" />
            </g>
            
            {/* Zębatka 2 (duża, prawa - obrót przeciwny) */}
            <g>
                <path 
                    d={gearPath(65, 50, 20, 8)} 
                    fill={colors[1]} 
                    stroke={colors[2]} 
                    strokeWidth="1"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="360 65 50"
                        to="0 65 50"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </path>
                <circle cx="65" cy="50" r="8" fill={colors[3]} opacity="0.5" />
            </g>
            
            {/* Zębatka 3 (mała, góra) */}
            <g>
                <path 
                    d={gearPath(50, 25, 12, 6)} 
                    fill={colors[2]} 
                    stroke={colors[0]} 
                    strokeWidth="1"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 50 25"
                        to="360 50 25"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </path>
                <circle cx="50" cy="25" r="5" fill={colors[3]} opacity="0.5" />
            </g>
        </svg>
    );
};

export default LoadingSpinnerGears;