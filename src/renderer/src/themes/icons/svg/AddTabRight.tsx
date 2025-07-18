import { SVGProps } from "react";

export function AddTabRight(props: SVGProps<SVGSVGElement>) {
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
          d="M5 19V5zv-.025zm0 2q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v8.35q-.475-.175-.975-.262T19 13V5H5v14h8q0 .525.088 1.025t.262.975zm14 2l-1.4-1.4l1.575-1.6H15v-2h4.175L17.6 16.4L19 15l4 4zm-8-6h2v-4h4v-2h-4V7h-2v4H7v2h4z"
        ></path>
      </svg>
    )
  }
  