import React, { SVGProps } from "react";

export function CircleGauge(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            {...props}
        >
            <g
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            >
                <path d="M15.6 2.7a10 10 0 1 0 5.7 5.7"></path>
                <circle cx="12" cy="12" r="2"></circle>
                <path d="M13.4 10.6L19 5"></path>
            </g>
        </svg>
    );
}

export function CircleGaugeRotating(props: SVGProps<SVGSVGElement> & { speed?: number }) {
    const speed = props.speed ?? 1.2; // sekundy na obrót
    return (
        <span
            style={{
                display: "flex",
                animation: `cg-rotate ${speed}s linear infinite`,
            }}
        >
            <CircleGauge {...props} />
            <style>
                {`
                @keyframes cg-rotate {
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </span>
    );
}

