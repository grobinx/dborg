import { SVGProps } from "react";

export function Disconnected(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 2048 2048"
            width="1em"
            height="1em"
            {...props}
        >
            <path
                fill="currentColor"
                d="m1300 1201l-271 271l90 90l-226 227q-63 63-145 97t-172 34q-73 0-141-22t-127-67l-199 198l-90-90l198-199q-44-58-66-126t-23-142q0-89 34-171t97-146l227-226l90 90l271-271l91 90l-272 272l272 272l272-272zm-724 591q64 0 122-24t104-70l136-136l-452-452l-136 136q-45 45-69 103t-25 123q0 66 25 124t68 102t102 69t125 25M1831 308q44 58 66 126t23 142q0 89-34 171t-97 146l-227 226l-633-633l226-227q63-63 145-97t172-34q73 0 141 22t127 67l199-198l90 90zm-133 494q45-45 69-103t25-123q0-66-25-124t-69-101t-102-69t-124-26q-64 0-122 24t-104 70l-136 136l452 452z"
            ></path>
        </svg>
    )
}
