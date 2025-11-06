import ActionButton, { ActionButtonProps } from "./ActionButton";

export interface ButtonOwnProps<T = any> extends ActionButtonProps<T> {
}

export const Button = <T,>(props: ButtonOwnProps<T>) => {
    const { actionShows, ...other } = props;

    const shows = { label: true, icon: true, shortcut: true, tooltip: false, ...actionShows }; 

    return (
        <ActionButton<T>
            componentName="Button"
            actionShows={shows}
            {...other}
        />
    );
};
