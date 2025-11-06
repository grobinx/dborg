import ActionButton, { ActionButtonProps } from "./ActionButton";

export interface IconButtonOwnProps<T = any> extends ActionButtonProps<T> {
}

export const IconButton = <T,>(props: IconButtonOwnProps<T>) => {
    const { actionShows, ...other } = props;

    const shows = { label: false, icon: true, shortcut: false, tooltip: true, ...actionShows };

    return (
        <ActionButton
            componentName="IconButton"
            actionShows={shows}
            {...other}
        />
    );
};
