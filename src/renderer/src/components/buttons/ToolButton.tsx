import ActionButton, { ActionButtonProps } from "./ActionButton";

export interface ToolButtonOwnProps<T = any> extends ActionButtonProps<T> {
}

export const ToolButton = <T,>(props: ToolButtonOwnProps<T>) => {
    const { actionShows, ...other } = props;

    const shows = { label: false, icon: true, shortcut: false, tooltip: true, ...actionShows };

    return (
        <ActionButton<T>
            componentName="ToolButton"
            actionShows={shows}
            {...other}
        />
    );
};
