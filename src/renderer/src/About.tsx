import React from 'react';
import logo from '../../../resources/dborg.png';
import { useTranslation } from 'react-i18next';
import dborgPackage from '../../../package.json';
import { dborgDate, dborgDuration, dborgReleaseName, version } from '../../api/consts';
import { keyframes, styled, Typography, useTheme } from '@mui/material';
import { MorphingSvgPaths } from './components/MorphingSvgs';
import { TextDecorator } from './components/useful/TextDecorator';
import clsx from './utils/clsx';

const ORBADA = 'ORBADA';
const DATABASE_ORGANIZER = 'Database Organizer';
const ANIMATION_SPEED = 1;
const totalDelay = (ORBADA.length + 2) * ANIMATION_SPEED * 0.15 + ANIMATION_SPEED * 0.8;

const StyledAppTitle = styled('div')({
    transition: "all 0.2s ease-in-out",
    marginBottom: '24px',
    textAlign: 'center',
    alignContent: 'center',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 0 0 3px rgba(50, 197, 62, 0.6)',
    zIndex: 2,
    width: 750,
    height: 120,
    position: 'relative',
    //border: '2px solid #fff',
    '&.char-animation-finished': {
        animation: `outline-effect ${ANIMATION_SPEED * 0.8}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    },
    '@keyframes outline-effect': {
        '0%': {
            transform: 'scale(0.95)',
            boxShadow: `
                0px 4px 10px rgba(0, 0, 0, 0.5),
                0 0 0 3px rgba(50, 197, 62, 0.6)
            `,
        },
        '11%': {
            boxShadow: `
                0px 4px 10px rgba(0, 0, 0, 0.5),
                0 0 0 20px rgba(0, 255, 0, 0.6)
            `,
        },
        '20%': {
            transform: 'scale(1.1)',
        },
        '90%': {
            transform: 'scale(1)',
        },
        '100%': {
            boxShadow: `
                0px 4px 150px rgba(0, 0, 0, 0.5),
                0 0 0 350px rgba(0, 255, 0, 0),
                0 0 0 3px rgba(50, 197, 62, 0.6)
            `,
        },
    },
});

const zoomIn = (initialScale: number = 4) => keyframes`
  0% { transform: scale(${initialScale}); opacity: 0; }
  50% { opacity: 1; }
  70% { transform: scale(0.95); }
  85% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
`;

const afterWave = (initialScale: number = 1.05, translateY: number = 8) => keyframes`
  0% { transform: translateY(0) scale(1); }
  40% { transform: translateY(${translateY}px) scale(${initialScale}); }
  100% { transform: translateY(0) scale(1); }
`;

// DODANE: animacja z utrzymanym przesunięciem na środek
const zoomInCentered = keyframes`
  0% { transform: translateX(-50%) scale(0.4); opacity: 0; }
  50% { opacity: 1; }
  70% { transform: translateX(-50%) scale(0.95); }
  85% { transform: translateX(-50%) scale(1.05); }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
`;

const AnimatedZoomIn = styled('span')<{ delay: number, initialScale?: number }>(({ delay, initialScale = 3 }) => ({
    display: 'inline-block',
    opacity: 0,
    animation: `${zoomIn(initialScale)} ${ANIMATION_SPEED * 0.6}s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${delay}s forwards`,
}));

const AnimatedReleaseName = styled('span')<{ delay: number }>(({ delay, theme }) => ({
    fontSize: '18px',
    display: 'inline-block',
    opacity: 0,
    animation: `${zoomInCentered} ${ANIMATION_SPEED * 0.6}s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${delay}s forwards`,
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)', // DODANE: bazowe przesunięcie na środek
    textAlign: 'center',
    width: 'max-content',
    color: theme.palette.error.light,
    fontWeight: 'bold',
}));

const StyledAppInfoContainer = styled('div')<{ delayShift: number }>(({ delayShift = 0 }) => ({
    marginBottom: '24px',
    textAlign: 'left',
    fontSize: '16px',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '16px',
    borderRadius: '8px',
    zIndex: 2,
    boxShadow: '0 0 0 3px rgba(50, 197, 62, 0.6)',
    animation: `${afterWave()} ${ANIMATION_SPEED * 0.8}s cubic-bezier(0.45, 0.05, 0.55, 0.95) ${totalDelay - 0.3 + ANIMATION_SPEED * delayShift}s`,
}));

const StyledTextInfo = styled('div')<{ index: number }>(({ index, theme }) => ({
    ...theme.typography.body1,
    fontSize: '20px',
    animation: `${afterWave(1.025 - index * 0.003, 8 - index * 0.5)} ${ANIMATION_SPEED * (0.3 + index * 0.1)}s cubic-bezier(0.45, 0.05, 0.55, 0.95) ${totalDelay - 0.3 + index * 0.05}s`,
}));

const AnimatedWaves = styled('div')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    '& svg': {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.3,
        mixBlendMode: 'screen',
    },
});

const LayeredWaves = () => {
    return (
        <MorphingSvgPaths
            paths={[
                [
                    { d: "M0 364L21.5 363.3C43 362.7 86 361.3 128.8 370.7C171.7 380 214.3 400 257.2 409.5C300 419 343 418 385.8 412.3C428.7 406.7 471.3 396.3 514.2 395.5C557 394.7 600 403.3 642.8 401.2C685.7 399 728.3 386 771.2 377.5C814 369 857 365 878.5 363L900 361L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#fa7268" },
                    { d: "M0 447L21.5 446.2C43 445.3 86 443.7 128.8 435.8C171.7 428 214.3 414 257.2 411C300 408 343 416 385.8 426.8C428.7 437.7 471.3 451.3 514.2 453.8C557 456.3 600 447.7 642.8 441.3C685.7 435 728.3 431 771.2 437.8C814 444.7 857 462.3 878.5 471.2L900 480L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#ef5f67" },
                    { d: "M0 475L21.5 474.7C43 474.3 86 473.7 128.8 476.8C171.7 480 214.3 487 257.2 482.5C300 478 343 462 385.8 454.2C428.7 446.3 471.3 446.7 514.2 446.3C557 446 600 445 642.8 444.5C685.7 444 728.3 444 771.2 447C814 450 857 456 878.5 459L900 462L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#e34c67" },
                    { d: "M0 519L21.5 521.5C43 524 86 529 128.8 524.5C171.7 520 214.3 506 257.2 505.2C300 504.3 343 516.7 385.8 515.5C428.7 514.3 471.3 499.7 514.2 497C557 494.3 600 503.7 642.8 505.7C685.7 507.7 728.3 502.3 771.2 501.7C814 501 857 505 878.5 507L900 509L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#d53867" },
                    { d: "M0 544L21.5 543.7C43 543.3 86 542.7 128.8 547C171.7 551.3 214.3 560.7 257.2 560.3C300 560 343 550 385.8 543C428.7 536 471.3 532 514.2 534.2C557 536.3 600 544.7 642.8 549C685.7 553.3 728.3 553.7 771.2 553C814 552.3 857 550.7 878.5 549.8L900 549L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#c62368" },
                ],
                [
                    { d: "M0 386L21.5 391C43 396 86 406 128.8 402.3C171.7 398.7 214.3 381.3 257.2 373.2C300 365 343 366 385.8 365.8C428.7 365.7 471.3 364.3 514.2 365.3C557 366.3 600 369.7 642.8 375.5C685.7 381.3 728.3 389.7 771.2 391.7C814 393.7 857 389.3 878.5 387.2L900 385L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#fa7268" },
                    { d: "M0 413L21.5 416.3C43 419.7 86 426.3 128.8 431.3C171.7 436.3 214.3 439.7 257.2 439.2C300 438.7 343 434.3 385.8 435.3C428.7 436.3 471.3 442.7 514.2 442C557 441.3 600 433.7 642.8 438C685.7 442.3 728.3 458.7 771.2 463.7C814 468.7 857 462.3 878.5 459.2L900 456L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#ef5f67" },
                    { d: "M0 472L21.5 472.7C43 473.3 86 474.7 128.8 478.2C171.7 481.7 214.3 487.3 257.2 484.2C300 481 343 469 385.8 463.5C428.7 458 471.3 459 514.2 463C557 467 600 474 642.8 470.7C685.7 467.3 728.3 453.7 771.2 458.2C814 462.7 857 485.3 878.5 496.7L900 508L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#e34c67" },
                    { d: "M0 506L21.5 506.7C43 507.3 86 508.7 128.8 513.2C171.7 517.7 214.3 525.3 257.2 523.5C300 521.7 343 510.3 385.8 502.8C428.7 495.3 471.3 491.7 514.2 497.2C557 502.7 600 517.3 642.8 518.3C685.7 519.3 728.3 506.7 771.2 501.8C814 497 857 500 878.5 501.5L900 503L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#d53867" },
                    { d: "M0 559L21.5 557.3C43 555.7 86 552.3 128.8 548.2C171.7 544 214.3 539 257.2 536.3C300 533.7 343 533.3 385.8 539.5C428.7 545.7 471.3 558.3 514.2 557.3C557 556.3 600 541.7 642.8 538.5C685.7 535.3 728.3 543.7 771.2 543.5C814 543.3 857 534.7 878.5 530.3L900 526L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#c62368" }
                ],
                [
                    { d: "M0 418L21.5 408.5C43 399 86 380 128.8 379.5C171.7 379 214.3 397 257.2 398.3C300 399.7 343 384.3 385.8 385.5C428.7 386.7 471.3 404.3 514.2 412.7C557 421 600 420 642.8 423.5C685.7 427 728.3 435 771.2 435.7C814 436.3 857 429.7 878.5 426.3L900 423L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#fa7268" },
                    { d: "M0 446L21.5 443.8C43 441.7 86 437.3 128.8 433.8C171.7 430.3 214.3 427.7 257.2 435.2C300 442.7 343 460.3 385.8 466.7C428.7 473 471.3 468 514.2 457.5C557 447 600 431 642.8 425.5C685.7 420 728.3 425 771.2 434.8C814 444.7 857 459.3 878.5 466.7L900 474L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#ef5f67" },
                    { d: "M0 461L21.5 461.3C43 461.7 86 462.3 128.8 465.5C171.7 468.7 214.3 474.3 257.2 481.5C300 488.7 343 497.3 385.8 490.5C428.7 483.7 471.3 461.3 514.2 459.3C557 457.3 600 475.7 642.8 479.3C685.7 483 728.3 472 771.2 464.7C814 457.3 857 453.7 878.5 451.8L900 450L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#e34c67" },
                    { d: "M0 501L21.5 499.8C43 498.7 86 496.3 128.8 498.3C171.7 500.3 214.3 506.7 257.2 504.5C300 502.3 343 491.7 385.8 487.8C428.7 484 471.3 487 514.2 492.7C557 498.3 600 506.7 642.8 511.7C685.7 516.7 728.3 518.3 771.2 516.3C814 514.3 857 508.7 878.5 505.8L900 503L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#d53867" },
                    { d: "M0 535L21.5 538.2C43 541.3 86 547.7 128.8 546.5C171.7 545.3 214.3 536.7 257.2 533.8C300 531 343 534 385.8 533.3C428.7 532.7 471.3 528.3 514.2 531C557 533.7 600 543.3 642.8 550C685.7 556.7 728.3 560.3 771.2 561.7C814 563 857 562 878.5 561.5L900 561L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#c62368" }
                ]
            ]}
        />
    );
}

const About: React.FC<{
    loading?: boolean,
    loadingText?: string
}> = ({ loading, loadingText }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [charAnimationFinished, setCharAnimationFinished] = React.useState(false);
    const [showRelease, setShowRelease] = React.useState(false);

    const displayText = React.useMemo(() => {
        const chars: React.ReactNode[] = [];

        // Dodaj litery ORBADA
        for (let i = 0; i < ORBADA.length; i++) {
            chars.push(
                <AnimatedZoomIn key={i} delay={i * ANIMATION_SPEED * 0.15}>
                    {ORBADA.charAt(i)}
                </AnimatedZoomIn>
            );
        }

        // Dodaj logo
        chars.push(
            <AnimatedZoomIn
                key="logo"
                delay={ORBADA.length * ANIMATION_SPEED * 0.15 + ANIMATION_SPEED * 0.4}
                initialScale={5}
            >
                <img src={logo} alt="Logo" style={{
                    width: '48px',
                    height: '48px',
                    verticalAlign: 'middle',
                    marginLeft: '8px',
                    marginRight: '8px',
                    marginBottom: '6px',
                }} />
            </AnimatedZoomIn>
        );

        // Dodaj "- Database Organizer"
        chars.push(
            <AnimatedZoomIn
                key="subtitle"
                delay={ORBADA.length * ANIMATION_SPEED * 0.15}
                initialScale={2}
            >
                {DATABASE_ORGANIZER}
            </AnimatedZoomIn>
        );

        return chars;
    }, []);

    React.useEffect(() => {
        const timer1 = setTimeout(() => {
            setCharAnimationFinished(true);
        }, totalDelay * 800);

        const timer2 = setTimeout(() => {
            setShowRelease(true);
        }, (totalDelay + ANIMATION_SPEED * 0.05) * 1000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            fontSize: '24px',
            color: '#fff',
            overflow: 'hidden',
            background: '#181c24',
        }}>
            {/* Animowane fale SVG na dole */}
            <AnimatedWaves>
                <LayeredWaves />
            </AnimatedWaves>

            <StyledAppTitle
                className={clsx(
                    charAnimationFinished && 'char-animation-finished'
                )}
            >
                <Typography variant="h4" height={50} marginBottom={10} fontSize="40px">
                    <TextDecorator variant="NeonText">
                        {displayText}
                    </TextDecorator>
                </Typography>
                {showRelease && (
                    <AnimatedReleaseName delay={0}>
                        {dborgReleaseName}
                    </AnimatedReleaseName>
                )}
            </StyledAppTitle>

            {
                <StyledAppInfoContainer delayShift={0} style={{
                    visibility: loading ? 'visible' : 'hidden',
                }}>
                    <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        textShadow: '0px 0px 8px rgba(0, 0, 0, 0.5)',
                        zIndex: 2,
                        display: 'inline-flex',
                        gap: '8px',
                        alignItems: 'center',
                    }}>
                        <theme.icons.Loading />
                        {loadingText ?? t('loading---', 'Loading...')}
                    </span>
                </StyledAppInfoContainer>
            }

            {/* Informacje o aplikacji */}
            <StyledAppInfoContainer delayShift={0.1}>
                <StyledTextInfo index={0}><strong>{t('version-dd', 'Version:')}</strong> {version.toString()}</StyledTextInfo>
                <StyledTextInfo index={1}><strong>{t('author-dd', 'Author:')}</strong> {dborgPackage.author}</StyledTextInfo>
                <StyledTextInfo index={2}><strong>{t('homepage-dd', 'Homepage:')}</strong> <a href={dborgPackage.homepage} target="_blank" rel="noopener noreferrer" style={{ color: '#00f2fe' }}>{dborgPackage.homepage}</a></StyledTextInfo>
                <StyledTextInfo index={3}><strong>{t('license-dd', 'License:')}</strong> {dborgPackage.license}</StyledTextInfo>
                <StyledTextInfo index={4}><strong>{t('date-dd', 'Date:')}</strong> {dborgDate}</StyledTextInfo>
                <StyledTextInfo index={5}><strong>{t('duration-dd', 'Duration:')}</strong> {dborgDuration}</StyledTextInfo>
                <StyledTextInfo index={6}><strong>{t('environment-dd', 'Environment:')}</strong>&nbsp;
                    E: {window.electron.versions.electron},
                    N: {window.electron.versions.node},
                    C: {window.electron.versions.chrome}
                </StyledTextInfo>
            </StyledAppInfoContainer>
        </div >
    );
};

export default About;