import { SVGProps } from "react";

export function Resume(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            {...props}
        >
            <path
                fill="currentColor"
                d="M6 18V6h2v12zm4 0l10-6l-10-6zm2-3.525v-4.95L16.125 12zM12 12"
            ></path>
        </svg>
    )
}
