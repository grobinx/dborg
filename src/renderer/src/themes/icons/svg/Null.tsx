import { SVGProps } from "react";

export function Null(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            color="inherit"
            {...props}
        >
            <text
                x="50%"
                y="50%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-size="22"
                font-family="Arial, sans-serif"
                fill="currentColor" // Ustawienie koloru dziedziczonego od rodzica
            >
                ∅
            </text>
        </svg>
    );
}
