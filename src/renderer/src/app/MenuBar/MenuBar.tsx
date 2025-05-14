import { Box, BoxProps, styled, Typography, useTheme, useThemeProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import ZoomState from './ZoomState';
import logo from '../../../../../resources/dborg.png';
import WindowControlButton from './WindowControlButton';
import { WindowState } from 'src/api/electron';
import { Messages, useMessages } from '@renderer/contexts/MessageContext';

const MenuBarTitle = styled(Typography, {
    name: 'MenuBar',
    slot: 'title',
})(({ theme }) => ({
    ...theme.typography.body1,
    color: theme.palette.menuBar?.contrastText,
    appRegion: "drag",
    flexGrow: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: undefined,
    height: "100%",
}));

const MenuBarRoot = styled(Box, {
    name: 'MenuBar', // The component name
    slot: 'root', // The slot name
})(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: theme.palette.background.menuBar,
    color: theme.palette.menuBar?.contrastText,
    width: '100%',
    alignItems: "center",
}));

export interface MenuBarProps extends BoxProps {
}

interface MenuBarOwnProps extends MenuBarProps {
    subTitle?: string
}

const MenuBar: React.FC<MenuBarOwnProps> = (props) => {
    const theme = useTheme();
    const { subTitle, className, ...other } = useThemeProps({ name: 'MenuBar', props });
    const { t } = useTranslation();
    const [windowMaximized, setWindowMaximized] = React.useState(false);
    const [windowMinimized, setWindowMinimized] = React.useState(false);
    const [windowFullScreen, setWindowFullScreen] = React.useState(false);
    const { sendMessage } = useMessages();

    const handleCloseWindow = (): void => {
        window.electron.main.close();
    }
    const handleWindowMaximized = (): void => {
        if (!windowMaximized) {
            window.electron.main.maximize();
        }
        else {
            window.electron.main.restore();
        }
    }
    const handleWindowMinimized = (): void => {
        if (!windowMinimized) {
            window.electron.main.minimize();
        }
        else {
            window.electron.main.restore();
        }
    }

    React.useEffect((): ReturnType<React.EffectCallback> => {
        const updateState = (state: WindowState): void => {
            if (state.maximized != windowMaximized) {
                setWindowMaximized(state.maximized);
            }
            if (state.minimized != windowMinimized) {
                setWindowMinimized(state.minimized);
            }
            if (state.fullScreen != windowFullScreen) {
                setWindowFullScreen(state.fullScreen);
            }
        }
        const unsubscribe = window.electron.main.onState((state: WindowState): void => {
            updateState(state);
        });
        window.electron.main.state().then((state: WindowState) => {
            updateState(state);
        })
        return unsubscribe;
    })

    return (
        <MenuBarRoot
            {...other}
            className={(className ?? "") + " MenuBar-root"}
        >
            <WindowControlButton
                onClick={() => sendMessage(Messages.SIDE_BAR_BUTTON_TOGGLE_EXPAND)}
                className="LogoWindowControlButton"
            >
                <img src={logo} className="LogoIcon" />
            </WindowControlButton>
            <MenuBarTitle className="MenuBar-title" variant='body1'>
                {t('dborg-title', 'Database Organizer') + (subTitle ? " - " + subTitle : "")}
            </MenuBarTitle>
            {other.children}
            <ZoomState />
            <WindowControlButton
                toolTip={t('minimize', 'Minimize')}
                onClick={handleWindowMinimized}
                className="MinimizeWindowControlButton"
            >
                <theme.icons.MinimizeWindow />
            </WindowControlButton>
            {(!windowMaximized && !windowFullScreen) &&
                <WindowControlButton
                    toolTip={t('maximize', 'Maximize')}
                    onClick={handleWindowMaximized}
                    className="MaximieWindowControlButton"
                >
                    <theme.icons.MaximizeWindow />
                </WindowControlButton>
            }
            {(windowMaximized && !windowFullScreen) &&
                <WindowControlButton
                    toolTip={t('restore', 'Restore')}
                    onClick={handleWindowMaximized}
                    className="RestoreWindowControlButton"
                >
                    <theme.icons.RestoreWindow />
                </WindowControlButton>
            }
            <WindowControlButton
                toolTip={t('close', 'Close')}
                onClick={handleCloseWindow}
                className="CloseWindowControlButton"
            >
                <theme.icons.CloseWindow />
            </WindowControlButton>
        </MenuBarRoot>
    )
}

export default MenuBar;