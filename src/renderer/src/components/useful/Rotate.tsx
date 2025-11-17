import React from "react";

export function Rotate(props: { speed?: number, children: React.ReactNode, angle?: number }) {
    const { speed = 1.2, children, angle } = props;
    const animated = angle === undefined;

    return (
        <span
            style={{
                display: "flex",
                transform: angle !== undefined ? `rotate(${angle}deg)` : undefined,
                animation: animated ? `cg-rotate ${speed}s linear infinite` : undefined,
                transition: angle !== undefined ? `transform ${speed}s cubic-bezier(0.4,0,0.2,1)` : undefined,
            }}
        >
            {children}
            {animated && (
                <style>
                    {`
                    @keyframes cg-rotate {
                        100% { transform: rotate(360deg); }
                    }
                    `}
                </style>
            )}
        </span>
    );
}

