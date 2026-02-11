import React from "react";

const LoadingSpinnerRipple: React.FC<{ colors: string[]; size?: number }> = ({ colors, size = 54 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        {/* Fala 1 */}
        <circle cx="50" cy="50" r="5" fill="none" stroke={colors[0]} strokeWidth="3">
            <animate attributeName="r" from="5" to="45" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" from="3" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Fala 2 */}
        <circle cx="50" cy="50" r="5" fill="none" stroke={colors[1]} strokeWidth="3">
            <animate attributeName="r" from="5" to="45" dur="2s" begin="0.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" from="3" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Fala 3 */}
        <circle cx="50" cy="50" r="5" fill="none" stroke={colors[2]} strokeWidth="3">
            <animate attributeName="r" from="5" to="45" dur="2s" begin="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="2s" begin="1s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" from="3" to="0" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
        
        {/* Fala 4 */}
        <circle cx="50" cy="50" r="5" fill="none" stroke={colors[3]} strokeWidth="3">
            <animate attributeName="r" from="5" to="45" dur="2s" begin="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="2s" begin="1.5s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" from="3" to="0" dur="2s" begin="1.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Środek (kropla) */}
        <circle cx="50" cy="50" r="4" fill={colors[0]} opacity="0.8" />
    </svg>
);

export default LoadingSpinnerRipple;