import React from 'react';
import { styled } from '@mui/material/styles';
import Tooltip from '../Tooltip';

interface EllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
    blurred?: boolean;
    flex?: boolean;
    maxWidth?: number | string;
    tooltip?: React.ReactNode;
    /** Ile px przed maxWidth włączyć fade (0 = tylko przy realnym overflow) */
    blurThresholdPx?: number;
    children?: React.ReactNode;
}

interface StyledEllipsisProps {
    flex?: boolean;
    blurActive?: boolean;
    maxWidth?: number | string;
}

const StyledEllipsis = styled('span', {
    shouldForwardProp: (prop) => prop !== 'flex' && prop !== 'blurActive' && prop !== 'maxWidth',
})<StyledEllipsisProps>(({ flex, blurActive, maxWidth }) => ({
    display: 'inline-block',
    overflow: 'hidden',
    textOverflow: blurActive ? 'clip' : 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    maxWidth: maxWidth,
    position: 'relative',
    ...(flex ? { flex: 1 } : {}),
    ...(blurActive
        ? {
            WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
        }
        : {}),
}));

const getMaxWidthPx = (el: HTMLElement): number | null => {
    const raw = getComputedStyle(el).maxWidth;
    if (!raw || raw === 'none') return null;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : null;
};

export const Ellipsis: React.FC<EllipsisProps> = ({
    blurred = true,
    flex,
    maxWidth,
    tooltip,
    blurThresholdPx = 8,
    children,
    ...rest
}) => {
    const ref = React.useRef<HTMLSpanElement | null>(null);
    const [blurActive, setBlurActive] = React.useState(false);

    const recalc = React.useCallback(() => {
        const el = ref.current;
        if (!el) return;

        const overflow = el.scrollWidth > el.clientWidth + 1;
        const maxWidth = getMaxWidthPx(el);
        const nearMax = maxWidth !== null && el.clientWidth >= maxWidth - blurThresholdPx;

        const next = Boolean(blurred && (overflow || nearMax));
        setBlurActive((prev) => (prev === next ? prev : next));
    }, [blurred, blurThresholdPx]);

    React.useLayoutEffect(() => {
        const id = window.requestAnimationFrame(recalc);
        return () => window.cancelAnimationFrame(id);
    }, [recalc, children]);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(recalc);
            ro.observe(el);
            return () => ro.disconnect();
        }

        const onResize = () => recalc();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [recalc]);

    const content = (
        <StyledEllipsis ref={ref} flex={flex} blurActive={blurActive} maxWidth={maxWidth} {...rest}>
            {children}
        </StyledEllipsis>
    );

    if (blurActive && tooltip) {
        return (
            <Tooltip title={tooltip} slotProps={{ tooltip: { style: { maxWidth: 600 } } }}>
                {content}
            </Tooltip>
        );
    }
    return content;
};

// użycie:
// <Ellipsis blurred style={{ maxWidth: 200 }}>Tekst</Ellipsis>
// tylko przy realnym overflow:
// <Ellipsis blurred blurThresholdPx={0} style={{ maxWidth: 200 }}>Tekst</Ellipsis>