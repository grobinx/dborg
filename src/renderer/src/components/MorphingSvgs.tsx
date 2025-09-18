import React from "react";

interface WavePath {
    d: string;
    fill: string;
}

interface MorphingWavesProps {
    paths: WavePath[];
    morphPaths: WavePath[];
    duration?: number; // w sekundach
    viewBox?: string;
}

function getRandomDuration() {
    return (Math.random() * 14 + 6).toFixed(2); // 6-20s, z dokładnością do 0.01
}

export const MorphingSvgs: React.FC<MorphingWavesProps> = ({
    paths,
    morphPaths,
    duration,
    viewBox = "0 0 900 600",
}) => {
    if (paths.length !== morphPaths.length) {
        return <div style={{ color: "red" }}>Liczba ścieżek musi być taka sama!</div>;
    }

    // Losuj duration dla każdej ścieżki jeśli nie podano globalnego
    const durations = React.useMemo(
        () =>
            duration !== undefined
                ? Array(paths.length).fill(duration)
                : Array.from({ length: paths.length }, getRandomDuration),
        [duration, paths.length]
    );

    return (
        <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto", display: "block" }}>
            {paths.map((path, i) => (
                <path key={i} fill={path.fill} d={path.d}>
                    <animate
                        attributeName="d"
                        dur={`${durations[i]}s`}
                        repeatCount="indefinite"
                        values={`${path.d};${morphPaths[i].d};${path.d}`}
                    />
                </path>
            ))}
        </svg>
    );
};