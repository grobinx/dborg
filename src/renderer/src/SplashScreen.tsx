import React from 'react';
import logo from '../../../resources/dborg.png';
import splashBackground from '../../../resources/splash-background.svg';
import { useTranslation } from 'react-i18next';
import dborgPackage from '../../../package.json';
import { dborgDate, dborgDuration, dborgReleaseName, version } from '../../../src/api/consts';

const SplashScreen: React.FC = () => {
    const { t } = useTranslation();

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
            backgroundImage: `url(${splashBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
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

            {/* Logo */}
            <img src={logo} alt="Logo" style={{
                marginBottom: '16px',
                width: '150px',
                height: '150px',
                animation: 'bounce 2s infinite',
                zIndex: 2 // Wyższy z-index, aby było widoczne nad nakładką
            }} />

            {/* Tekst ładowania */}
            <span style={{
                fontSize: '20px',
                fontWeight: 'bold',
                textShadow: '0px 0px 8px rgba(0, 0, 0, 0.5)',
                zIndex: 2
            }}>
                {t('loading---', 'Loading...')}
            </span>

            {/* Informacje o aplikacji */}
            <div style={{
                marginTop: '24px',
                textAlign: 'left',
                fontSize: '16px',
                color: '#fff',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.5)',
                zIndex: 2
            }}>
                <p><strong>{t('description-dd', 'Description:')}</strong> {dborgPackage.description}</p>
                <p><strong>{t('release-dd', 'Release:')}</strong> {dborgReleaseName}</p>
                <p><strong>{t('version-dd', 'Version:')}</strong> {version.toString()}</p>
                <p><strong>{t('author-dd', 'Author:')}</strong> {dborgPackage.author}</p>
                <p><strong>{t('homepage-dd', 'Homepage:')}</strong> <a href={dborgPackage.homepage} target="_blank" rel="noopener noreferrer" style={{ color: '#00f2fe' }}>{dborgPackage.homepage}</a></p>
                <p><strong>{t('license-dd', 'License:')}</strong> {dborgPackage.license}</p>
                <p><strong>{t('date-dd', 'Date:')}</strong> {dborgDate}</p>
                <p><strong>{t('duration-dd', 'Duration:')}</strong> {dborgDuration}</p>
            </div>
        </div>
    );
};

export default SplashScreen;