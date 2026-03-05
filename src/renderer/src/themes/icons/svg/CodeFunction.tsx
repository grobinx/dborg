import { SVGProps } from "react";

export function CodeFunction(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <rect x="1" y="1" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" rx="4" />
      <text x="11" y="16" fontSize="14" textAnchor="middle" fontFamily="monospace" fontWeight="bold" letterSpacing="-1.5">{'<f>'}</text>
    </svg>
  )
}
