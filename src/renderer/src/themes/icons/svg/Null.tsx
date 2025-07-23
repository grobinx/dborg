import { SVGProps } from "react";

export function Null(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 -2 24 24"
            color="inherit"
            {...props}
        >
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="24"
                fontFamily="Arial, sans-serif"
                fill="currentColor" // Ustawienie koloru dziedziczonego od rodzica
            >
                ∅
            </text>
        </svg>
    );
}
