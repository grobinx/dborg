
const LoadingSpinnerPulse: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => (
    <svg width={size} height={size} viewBox="0 0 50 50" style={{ display: "block" }}>
        <circle cx="25" cy="25" r="20" fill="none" stroke={colors[0]} strokeWidth="4">
            <animate attributeName="r" from="8" to="20" dur="1.5s" begin="0s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="25" r="20" fill="none" stroke={colors[2]} strokeWidth="4">
            <animate attributeName="r" from="8" to="20" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
    </svg>
);

export default LoadingSpinnerPulse;
