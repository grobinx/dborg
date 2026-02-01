import * as React from "react";

export type PixelsIconPalette = Record<number, string> | string[];

export interface PixelsIconProps {
    /**
     * 2D array: [row][col] => value (usually 0..9). 0 means transparent by default.
     */
    pixels: number[][];

    /**
     * Color map for values. Example: { 1: "#fff", 2: "rgba(...)" } or an array where palette[value] = color.
     */
    palette: PixelsIconPalette;

    /**
     * Logical size of a single square (in the icon's own coordinate system).
     * This influences the aspect ratio when gaps are used. Final render size is controlled by width/height/size.
     * @default 2
     */
    pixelSize?: number;

    /**
     * Logical gap between squares (in the icon's own coordinate system).
     * @default 0
     */
    gap?: number;

    /**
     * If true, value 0 will be rendered using palette[0] (if provided). Otherwise 0 is transparent.
     * @default false
     */
    drawZero?: boolean;

    /**
     * Optional title / tooltip.
     */
    title?: string;

    className?: string;
    style?: React.CSSProperties;

    /**
     * Background fill of the rendered area (e.g. "transparent" or "#111").
     * If omitted, background stays transparent.
     */
    background?: string;

    /**
     * Target render size. Useful for scaling to font size: size="1em".
     * If set, it defines BOTH width and height of the outer box.
     */
    size?: number | string;

    /**
     * Target render width/height of the outer box (CSS length).
     * If not provided, component uses its natural pixel grid size (based on pixelSize+gap).
     */
    width?: number | string;
    height?: number | string;

    /**
     * How to fit the pixel-grid into the target box.
     * - "contain": keep aspect ratio, letterbox if needed (default)
     * - "stretch": fill entire box, may distort aspect ratio
     */
    fit?: "contain" | "stretch";
}

function resolveColor(palette: PixelsIconPalette, value: number): string | undefined {
    if (Array.isArray(palette)) return palette[value];
    return palette[value];
}

function toCssSize(v: number | string | undefined): string | undefined {
    if (v === undefined) return undefined;
    return typeof v === "number" ? `${v}px` : v;
}

export const PixelsIcon: React.FC<PixelsIconProps> = React.memo((props) => {
    const {
        pixels,
        palette,
        pixelSize = 2,
        gap = 0,
        drawZero = false,
        title,
        className,
        style,
        background,
        size,
        width,
        height,
        fit = "contain",
    } = props;

    const containerRef = React.useRef<HTMLSpanElement | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

    const { rows, cols } = React.useMemo(() => {
        const r = pixels?.length ?? 0;
        const c = r > 0 ? Math.max(...pixels.map((row) => row?.length ?? 0)) : 0;
        return { rows: r, cols: c };
    }, [pixels]);

    const logicalWidth = React.useMemo(() => {
        if (cols <= 0) return 0;
        return cols * pixelSize + (cols - 1) * gap;
    }, [cols, pixelSize, gap]);

    const logicalHeight = React.useMemo(() => {
        if (rows <= 0) return 0;
        return rows * pixelSize + (rows - 1) * gap;
    }, [rows, pixelSize, gap]);

    const [box, setBox] = React.useState<{ w: number; h: number } | null>(null);

    React.useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ro = new ResizeObserver((entries) => {
            const cr = entries[0]?.contentRect;
            if (!cr) return;
            setBox({ w: cr.width, h: cr.height });
        });

        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.max(1, window.devicePixelRatio || 1);

        // target CSS size (outer box size); if not provided, use natural logical size as CSS px
        const wCss = Math.max(0, box?.w ?? logicalWidth);
        const hCss = Math.max(0, box?.h ?? logicalHeight);

        // backbuffer size in device pixels
        canvas.width = Math.max(1, Math.round(wCss * dpr));
        canvas.height = Math.max(1, Math.round(hCss * dpr));

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // crisp pixels
        // @ts-ignore
        ctx.imageSmoothingEnabled = false;

        // draw in CSS pixels
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // clear
        ctx.clearRect(0, 0, wCss, hCss);

        // background
        if (background) {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, wCss, hCss);
        }

        if (logicalWidth <= 0 || logicalHeight <= 0) return;

        // scale & offset
        const scaleX = wCss / logicalWidth;
        const scaleY = hCss / logicalHeight;

        const sX = fit === "stretch" ? scaleX : Math.min(scaleX, scaleY);
        const sY = fit === "stretch" ? scaleY : sX;

        const offsetX = fit === "stretch" ? 0 : (wCss - logicalWidth * sX) / 2;
        const offsetY = fit === "stretch" ? 0 : (hCss - logicalHeight * sY) / 2;

        // draw squares
        for (let y = 0; y < rows; y++) {
            const row = pixels[y] || [];
            for (let x = 0; x < cols; x++) {
                const v = row[x] ?? 0;
                if (!drawZero && v === 0) continue;

                const color = resolveColor(palette, v);
                if (!color) continue;

                const px = x * (pixelSize + gap);
                const py = y * (pixelSize + gap);

                ctx.fillStyle = color;
                ctx.fillRect(
                    offsetX + px * sX,
                    offsetY + py * sY,
                    pixelSize * sX,
                    pixelSize * sY
                );
            }
        }
    }, [
        pixels,
        palette,
        pixelSize,
        gap,
        rows,
        cols,
        logicalWidth,
        logicalHeight,
        drawZero,
        background,
        box,
        fit,
    ]);

    if (rows === 0 || cols === 0) return null;

    const outerW = toCssSize(size ?? width) ?? `${logicalWidth}px`;
    const outerH = toCssSize(size ?? height) ?? `${logicalHeight}px`;

    return (
        <span
            ref={containerRef}
            className={className}
            title={title}
            style={{
                display: "inline-block",
                verticalAlign: "middle",
                width: outerW,
                height: outerH,
                lineHeight: 0,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                role={title ? "img" : undefined}
                aria-label={title}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />
        </span>
    );
});

PixelsIcon.displayName = "PixelsIcon";
export default PixelsIcon;