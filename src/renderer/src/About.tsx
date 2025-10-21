import React from 'react';
import logo from '../../../resources/dborg.png';
import { useTranslation } from 'react-i18next';
import dborgPackage from '../../../package.json';
import { dborgDate, dborgDuration, dborgReleaseName, version } from '../../api/consts';
import { keyframes, styled, Typography, useTheme } from '@mui/material';
import { MorphingSvgPaths } from './components/MorphingSvgs';
import { TextDecorator } from './components/useful/TextDecorator';
import clsx from './utils/clsx';
import { generateWavePaths } from './utils/waveGenerator';

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
        opacity: 0.5,
        mixBlendMode: 'screen',
    },
});

const LayeredWaves = () => {
    const paths = React.useMemo(() => generateWavePaths(10,  5), []);
    
    return <MorphingSvgPaths paths={paths} />;
};

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
                <StyledTextInfo index={0}><strong>{t('release-dd', 'Release:')}</strong> {dborgReleaseName}</StyledTextInfo>
                <StyledTextInfo index={1}><strong>{t('version-dd', 'Version:')}</strong> {version.toString()}</StyledTextInfo>
                <StyledTextInfo index={2}><strong>{t('author-dd', 'Author:')}</strong> {dborgPackage.author}</StyledTextInfo>
                <StyledTextInfo index={3}><strong>{t('homepage-dd', 'Homepage:')}</strong> <a href={dborgPackage.homepage} target="_blank" rel="noopener noreferrer" style={{ color: '#00f2fe' }}>{dborgPackage.homepage}</a></StyledTextInfo>
                <StyledTextInfo index={4}><strong>{t('license-dd', 'License:')}</strong> {dborgPackage.license}</StyledTextInfo>
                <StyledTextInfo index={5}><strong>{t('date-dd', 'Date:')}</strong> {dborgDate}</StyledTextInfo>
                <StyledTextInfo index={6}><strong>{t('duration-dd', 'Duration:')}</strong> {dborgDuration}</StyledTextInfo>
                <StyledTextInfo index={7}><strong>{t('environment-dd', 'Environment:')}</strong>&nbsp;
                    E: {window.electron.versions.electron},
                    N: {window.electron.versions.node},
                    C: {window.electron.versions.chrome}
                </StyledTextInfo>
            </StyledAppInfoContainer>
        </div >
    );
};

export default About;