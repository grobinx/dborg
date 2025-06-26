import React from 'react';
import logo from '../../../resources/dborg.png';
import splashBackground from '../../../resources/splash-background.svg';
import { useTranslation } from 'react-i18next';
import dborgPackage from '../../../package.json';
import { dborgDate, dborgDuration, dborgReleaseName, version } from '../../api/consts';
import { styled, Typography, useTheme } from '@mui/material';

// Styled component for the animated background
const AnimatedBackground = styled('div')({
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `url(${splashBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    animation: 'shrink 1s ease-out forwards',
    zIndex: 0,
    '@keyframes shrink': {
        '0%': {
            transform: 'scale(3)', // Start od dużego obrazka
            transformOrigin: 'bottom left', // Zaczepienie o lewy dolny róg
        },
        '100%': {
            transform: 'scale(1)', // Końcowy rozmiar
            transformOrigin: 'bottom left',
        },
    },
});

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
        }}>
            {/* Animowane tło */}
            <AnimatedBackground />

            {/* Nakładka przytłumiająca tło */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)', // Przytłumienie koloru (czarny z 50% przezroczystości)
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
                zIndex: 2 // Wyższy z-index, aby było widoczne nad nakładką
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