
const LoadingSpinnerHexagon: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        <defs>
            <linearGradient id="hex-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors[0]} />
                <stop offset="50%" stopColor={colors[2]} />
                <stop offset="100%" stopColor={colors[3]} />
            </linearGradient>
        </defs>
        <polygon
            points="50,10 80,30 80,70 50,90 20,70 20,30"
            fill="none"
            stroke="url(#hex-gradient)"
            strokeWidth="5"
            strokeLinecap="round"
        >
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="2s"
                repeatCount="indefinite"
            />
        </polygon>
        <polygon
            points="50,25 70,37.5 70,62.5 50,75 30,62.5 30,37.5"
            fill="none"
            stroke={colors[1]}
            strokeWidth="4"
            opacity="0.6"
        >
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 50 50"
                to="0 50 50"
                dur="3s"
                repeatCount="indefinite"
            />
        </polygon>
    </svg>
);

export default LoadingSpinnerHexagon;