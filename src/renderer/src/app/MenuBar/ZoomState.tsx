import { Stack, StackProps, styled, useTheme, useThemeProps, Zoom } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import React from "react";
import { WindowState } from "src/api/electron";

const ZoomStateValue = styled('span', {
    name: 'ZoomState',
    slot: 'value',
})(({ theme }) => ({
    ...theme.typography.subtitle2
}));

export interface ZoomStateProps extends StackProps {
    timeout?: TransitionProps['timeout'],
    delay?: number
}

interface ZoomStateOwnProps extends ZoomStateProps {
}

const ZoomStateRoot = styled(Stack, {
    name: 'ZoomState',
    slot: 'root',
})(({ theme }) => ({
    ...theme.typography.body1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: "center",
}));

const ZoomState: React.FC<ZoomStateOwnProps> = (props) => {
    const theme = useTheme();
    const { timeout, delay, ...other } = useThemeProps({ name: 'ZoomState', props });
    const [windowZoom, setWindowZoom] = React.useState(100);
    const [zoomVisible, setZoomVisible] = React.useState(false);

    React.useEffect((): ReturnType<React.EffectCallback> => {
        const updateState = (state: WindowState): void => {
            if (state.zoom != windowZoom) {
                setWindowZoom(state.zoom);
            }
        }
        const unsubscribe = window.electron.main.onState((state: WindowState): void => {
            updateState(state);
        });
        window.electron.main.state().then((state: WindowState) => {
            updateState(state);
        })
        return unsubscribe;
    });

    React.useEffect((): ReturnType<React.EffectCallback> => {
        setZoomVisible(true);
        const intervalId = setInterval(() => {
            setZoomVisible(false);
        }, delay ?? 5000);
        return () => {
            clearInterval(intervalId);
            setZoomVisible(false);
        }
    }, [windowZoom]);

    return (
        <Zoom in={zoomVisible} unmountOnExit timeout={timeout}>
            <ZoomStateRoot {...other}>
                <theme.icons.ZoomIn />
                <ZoomStateValue>
                    {windowZoom}
                </ZoomStateValue>
            </ZoomStateRoot>
        </Zoom>
    );
}

export default ZoomState;
