import React from 'react';
import logo from '../../../resources/dborg.png';
import { useTranslation } from 'react-i18next';
import dborgPackage from '../../../package.json';
import { dborgDate, dborgDuration, dborgReleaseName, version } from '../../api/consts';
import { styled, Typography, useTheme } from '@mui/material';
import { MorphingSvgs } from './components/MorphingSvgs';

// Styled component for the application info container
const StyledAppInfoContainer = styled('div')({
    marginBottom: '24px',
    textAlign: 'left',
    fontSize: '16px',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 2,
});

const AnimatedWaves = styled('div')({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 'auto',
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    '& svg': {
        width: '100%',
        height: 'auto',
        minHeight: "100%",
        maxHeight: "100%",
        animation: 'waveMove 10s linear infinite alternate',
        display: 'block',
    },
    '@keyframes waveMove': {
        '0%': { transform: 'translateY(0)' },
        '100%': { transform: 'translateY(100px)' },
    },
});

const WavesSvg = () => {
    return (
        <MorphingSvgs
            paths={[
                { d: "M0 364L21.5 363.3C43 362.7 86 361.3 128.8 370.7C171.7 380 214.3 400 257.2 409.5C300 419 343 418 385.8 412.3C428.7 406.7 471.3 396.3 514.2 395.5C557 394.7 600 403.3 642.8 401.2C685.7 399 728.3 386 771.2 377.5C814 369 857 365 878.5 363L900 361L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#fa7268" },
                { d: "M0 447L21.5 446.2C43 445.3 86 443.7 128.8 435.8C171.7 428 214.3 414 257.2 411C300 408 343 416 385.8 426.8C428.7 437.7 471.3 451.3 514.2 453.8C557 456.3 600 447.7 642.8 441.3C685.7 435 728.3 431 771.2 437.8C814 444.7 857 462.3 878.5 471.2L900 480L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#ef5f67" },
                { d: "M0 475L21.5 474.7C43 474.3 86 473.7 128.8 476.8C171.7 480 214.3 487 257.2 482.5C300 478 343 462 385.8 454.2C428.7 446.3 471.3 446.7 514.2 446.3C557 446 600 445 642.8 444.5C685.7 444 728.3 444 771.2 447C814 450 857 456 878.5 459L900 462L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#e34c67" },
                { d: "M0 519L21.5 521.5C43 524 86 529 128.8 524.5C171.7 520 214.3 506 257.2 505.2C300 504.3 343 516.7 385.8 515.5C428.7 514.3 471.3 499.7 514.2 497C557 494.3 600 503.7 642.8 505.7C685.7 507.7 728.3 502.3 771.2 501.7C814 501 857 505 878.5 507L900 509L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#d53867" },
                { d: "M0 544L21.5 543.7C43 543.3 86 542.7 128.8 547C171.7 551.3 214.3 560.7 257.2 560.3C300 560 343 550 385.8 543C428.7 536 471.3 532 514.2 534.2C557 536.3 600 544.7 642.8 549C685.7 553.3 728.3 553.7 771.2 553C814 552.3 857 550.7 878.5 549.8L900 549L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#c62368" },
            ]}
            morphPaths={[
                { d: "M0 386L21.5 391C43 396 86 406 128.8 402.3C171.7 398.7 214.3 381.3 257.2 373.2C300 365 343 366 385.8 365.8C428.7 365.7 471.3 364.3 514.2 365.3C557 366.3 600 369.7 642.8 375.5C685.7 381.3 728.3 389.7 771.2 391.7C814 393.7 857 389.3 878.5 387.2L900 385L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#fa7268" },
                { d: "M0 413L21.5 416.3C43 419.7 86 426.3 128.8 431.3C171.7 436.3 214.3 439.7 257.2 439.2C300 438.7 343 434.3 385.8 435.3C428.7 436.3 471.3 442.7 514.2 442C557 441.3 600 433.7 642.8 438C685.7 442.3 728.3 458.7 771.2 463.7C814 468.7 857 462.3 878.5 459.2L900 456L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#ef5f67" },
                { d: "M0 472L21.5 472.7C43 473.3 86 474.7 128.8 478.2C171.7 481.7 214.3 487.3 257.2 484.2C300 481 343 469 385.8 463.5C428.7 458 471.3 459 514.2 463C557 467 600 474 642.8 470.7C685.7 467.3 728.3 453.7 771.2 458.2C814 462.7 857 485.3 878.5 496.7L900 508L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#e34c67" },
                { d: "M0 506L21.5 506.7C43 507.3 86 508.7 128.8 513.2C171.7 517.7 214.3 525.3 257.2 523.5C300 521.7 343 510.3 385.8 502.8C428.7 495.3 471.3 491.7 514.2 497.2C557 502.7 600 517.3 642.8 518.3C685.7 519.3 728.3 506.7 771.2 501.8C814 497 857 500 878.5 501.5L900 503L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#d53867" },
                { d: "M0 559L21.5 557.3C43 555.7 86 552.3 128.8 548.2C171.7 544 214.3 539 257.2 536.3C300 533.7 343 533.3 385.8 539.5C428.7 545.7 471.3 558.3 514.2 557.3C557 556.3 600 541.7 642.8 538.5C685.7 535.3 728.3 543.7 771.2 543.5C814 543.3 857 534.7 878.5 530.3L900 526L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z", fill: "#c62368" }
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

    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100vh',
            fontSize: '24px',
            color: '#fff',
            overflow: 'hidden',
            background: '#181c24',
        }}>
            {/* Animowane fale SVG na dole */}
            <AnimatedWaves>
                <WavesSvg />
                <WavesSvg />
            </AnimatedWaves>

            {/* Nakładka przytłumiająca tło */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 1
            }}></div>

            <StyledAppInfoContainer>
                <Typography style={{ textAlign: 'center', fontSize: '24px' }}>
                    {dborgPackage.description}
                </Typography>
            </StyledAppInfoContainer>

            {/* Logo */}
            <img src={logo} alt="Logo" style={{
                marginBottom: '16px',
                width: '150px',
                height: '150px',
                animation: 'bounce 2s infinite',
                zIndex: 2
            }} />

            {loading && (
                <StyledAppInfoContainer>
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
            )}

            {/* Informacje o aplikacji */}
            <StyledAppInfoContainer>
                <Typography><strong>{t('release-dd', 'Release:')}</strong> {dborgReleaseName}</Typography>
                <Typography><strong>{t('version-dd', 'Version:')}</strong> {version.toString()}</Typography>
                <Typography><strong>{t('author-dd', 'Author:')}</strong> {dborgPackage.author}</Typography>
                <Typography><strong>{t('homepage-dd', 'Homepage:')}</strong> <a href={dborgPackage.homepage} target="_blank" rel="noopener noreferrer" style={{ color: '#00f2fe' }}>{dborgPackage.homepage}</a></Typography>
                <Typography><strong>{t('license-dd', 'License:')}</strong> {dborgPackage.license}</Typography>
                <Typography><strong>{t('date-dd', 'Date:')}</strong> {dborgDate}</Typography>
                <Typography><strong>{t('duration-dd', 'Duration:')}</strong> {dborgDuration}</Typography>
            </StyledAppInfoContainer>
        </div>
    );
};

export default About;