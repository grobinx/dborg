import { Rectangle, Size } from "electron";

export type OnResizedFn = (size: Size) => void;
export type OnMovedFn = (bounds: Rectangle) => void;
export type OnStateFn = (state: WindowState) => void;

export type WindowState = {
    minimized: boolean,
    maximized: boolean,
    focused: boolean,
    fullScreen: boolean,
    normal: boolean,
    visible: boolean,
    zoom: number
}
