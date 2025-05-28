import { styled, useThemeProps } from '@mui/material';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const StyledSplitPanelGroup = styled(PanelGroup, {
    name: "SplitPanel",
    slot: "group",
})(({ /*theme*/ }) => ({
    height: "100%",
    width: "100%",
}));

const StyledSplitPanel = styled(Panel, {
    name: "SplitPanel",
    slot: "panel",
})(({ /*theme*/ }) => ({
    width: "100%",
}));

const StyledSplitter = styled(PanelResizeHandle, {
    name: "SplitPanel",
    slot: "splitter",
})(({ /*theme*/ }) => ({
}));

interface SplitPanelGroupProps extends React.ComponentProps<typeof StyledSplitPanelGroup> {
}

interface SplitPanelGroupOwnProps extends SplitPanelGroupProps {
}

interface SplitPanelProps extends React.ComponentProps<typeof StyledSplitPanel> {
}

interface SplitPanelOwnProps extends SplitPanelProps {
}

interface SplitterProps extends React.ComponentProps<typeof StyledSplitter> {
}

interface SplitterOwnProps extends SplitterProps {
}

// Komponenty React z obsługą propsów
export const SplitPanelGroup: React.FC<SplitPanelGroupOwnProps> = (props) => {
    const { className, children, ref, ...other } = useThemeProps({
        props,
        name: "SplitPanelGroup",
    });

    return (
        <StyledSplitPanelGroup className={(className ?? "") + " SplitPanel-group"} {...other} ref={ref}>
            {children}
        </StyledSplitPanelGroup>
    );
};

export const SplitPanel: React.FC<SplitPanelOwnProps> = (props) => {
    const { className, children, ref, ...other } = useThemeProps({
        props,
        name: "SplitPanel",
    });

    return (
        <StyledSplitPanel className={(className ?? "") + " SplitPanel-panel"} {...other} ref={ref}>
            {children}
        </StyledSplitPanel>
    );
};

export const Splitter: React.FC<SplitterOwnProps> = (props) => {
    const { className, ...other } = useThemeProps({
        props,
        name: "Splitter",
    });

    return <StyledSplitter className={(className ?? "") + " SplitPanel-splitter"} {...other} />;
};