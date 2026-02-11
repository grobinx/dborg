const LoadingSpinnerOrbit: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: "block" }}>
            {/* Środek (słońce) */}
            <circle cx="60" cy="60" r="8" fill={colors[0]} />

            {/* Orbita 1 (najbliższa) */}
            <circle cx="60" cy="60" r="20" fill="none" stroke={colors[1]} strokeWidth="1" opacity="0.3" />
            <circle r="4" fill={colors[1]}>
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M 60,40 A 20,20 0 1,1 60,80 A 20,20 0 1,1 60,40" />
            </circle>

            {/* Orbita 2 (środkowa) */}
            <circle cx="60" cy="60" r="30" fill="none" stroke={colors[2]} strokeWidth="1" opacity="0.3" />
            <circle r="5" fill={colors[2]}>
                <animateMotion dur="2.5s" repeatCount="indefinite" path="M 60,30 A 30,30 0 1,1 60,90 A 30,30 0 1,1 60,30" />
            </circle>

            {/* Orbita 3 (najdalsza) + planeta + księżyc */}
            <circle cx="60" cy="60" r="40" fill="none" stroke={colors[3]} strokeWidth="1" opacity="0.3" />
            
            {/* Planeta */}
            <circle r="6" fill={colors[3]}>
                <animateMotion dur="4s" repeatCount="indefinite" path="M 60,20 A 40,40 0 1,1 60,100 A 40,40 0 1,1 60,20" />
            </circle>
            
            {/* Księżyc - osobny element z własnym centrum orbity */}
            <g>
                <animateMotion dur="4s" repeatCount="indefinite" path="M 60,20 A 40,40 0 1,1 60,100 A 40,40 0 1,1 60,20" />
                <circle r="3.5" fill={colors[1]} opacity="0.9">
                    {/* Orbita księżyca wokół planety (okrągła) */}
                    <animateMotion dur="1s" repeatCount="indefinite" path="M 12,0 A 12,12 0 1,1 -12,0 A 12,12 0 1,1 12,0" />
                </circle>
            </g>
        </svg>
    );
};

export default LoadingSpinnerOrbit;