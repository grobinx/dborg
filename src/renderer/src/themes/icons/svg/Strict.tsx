import { SVGProps } from "react";

export function Strict(props: SVGProps<SVGSVGElement>) {
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
          d="M13 2v6h-2V2zm-9 .586L9.914 8.5L8.5 9.914L2.586 4zM21.414 4L15.5 9.914L14.086 8.5L20 2.586zm-11.146 7A2 2 0 0 1 14 12a2 2 0 0 1-3.732 1H2v-2zM16 11h6v2h-6zm-6.086 4.5L4 21.414L2.586 20L8.5 14.086zm5.586-1.414L21.414 20L20 21.414L14.086 15.5zM13 16v6h-2v-6z"
        ></path>
      </svg>
    )
  }
  