import { SVGProps } from "react";

export function AdjustWidth(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="1em"
        height="1em"
        {...props}
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M1 13V3h1v10zm14 0h-1V3h1zM4.207 8.5l1.147 1.146l-.708.708L2.293 8l2.353-2.354l.708.708L4.207 7.5H7v1zm7.147-2.854L13.707 8l-2.353 2.354l-.708-.708L11.793 8.5H9v-1h2.793l-1.147-1.146z"
          clipRule="evenodd"
        ></path>
      </svg>
    )
  }
  