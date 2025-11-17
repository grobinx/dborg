
export function Rotating(props: { speed?: number, children: React.ReactNode }) {
    const { speed = 1.2, children } = props;
    return (
        <span
            style={{
                display: "flex",
                animation: `cg-rotate ${speed}s linear infinite`,
            }}
        >
            {children}
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

