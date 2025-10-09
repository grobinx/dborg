import React from "react";

const selectors = [
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])"
];

function isFocusable(el: HTMLElement) {
    return selectors.some(sel => el.matches(sel));
}

export type OnFocusedEvent = {
    focusedElement: HTMLElement;
    containerElement: HTMLElement;
    originalEvent: MouseEvent;
};

export type OnFocusedHandler = (event: OnFocusedEvent) => void;

interface FocusContainerHandlerProps {
    /**
     * Attribute to be used to mark focusable containers. Default is `data-focus-container`.
     * If the clicked element or its parent has this attribute, it will try to focus the first focusable element inside.
     * If the element itself is focusable, it will be focused.
     * @default "data-focus-container"
     */
    attribute?: string;
    /**
     * Function called after focusing an element inside the container.
     */
    onFocused?: OnFocusedHandler;
    /**
     * Attribute to exclude from focusing. If the element has this attribute, it will be ignored.
     */
    excludeAttribute?: string;
}

/**
 * Component that adds support for focusing the first element in containers with the `data-focus-container` attribute or another provided in `attribute`.
 * Adds a global `mouseup` listener that checks if the clicked element or its parent has the `data-focus-container` attribute.
 * If so, it tries to focus the first focusable element inside.
 * 
 * Elements with the `data-no-auto-focus` attribute (or another provided in `excludeAttribute`) are ignored.
 *
 * @example
 * ```tsx
 * <FocusContainerHandler />
 * 
 * <div data-focus-container>
 *   <label>Label</label>
 *   <button data-no-auto-focus>Don't focus me</button>
 *   <input type="text" />
 * </div>
 * ```
 * When the user clicks anywhere inside the container (even on the label), the input will be focused automatically.
 */
const FocusContainerHandler: React.FC<FocusContainerHandlerProps> = ({
    attribute = "data-focus-container",
    excludeAttribute = "data-no-auto-focus",
    onFocused
}) => {
    React.useEffect(() => {
        const handlePointerUp = (e: MouseEvent) => {
            if (window.getSelection && window.getSelection()?.isCollapsed === false) {
                return;
            }
            let el = e.target as HTMLElement | null;
            while (el && el !== document.body) {
                // Sprawdź, czy element ma atrybut wykluczający
                if (isFocusable(el)) {
                    el.focus();
                    onFocused?.({
                        focusedElement: el,
                        containerElement: el,
                        originalEvent: e,
                    });
                    return;
                }
                if (el.hasAttribute(attribute)) {
                    const focusableElements = el.querySelectorAll<HTMLElement>(selectors.join(","));
                    for (const focusable of Array.from(focusableElements)) {
                        // Sprawdź, czy znaleziony element ma atrybut wykluczający
                        if (!focusable.hasAttribute(excludeAttribute)) {
                            focusable.focus();
                            onFocused?.({
                                focusedElement: focusable,
                                containerElement: el,
                                originalEvent: e,
                            });
                            return;
                        }
                    }
                }
                el = el.parentElement; // Przejdź do rodzica
            }
        };
        document.addEventListener("pointerup", handlePointerUp);
        return () => document.removeEventListener("pointerup", handlePointerUp);
    }, [attribute, excludeAttribute, onFocused]);
    return null;
};

export const focusElement = (targetElement: HTMLElement) => {
    const event = new MouseEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        view: window,
    });
    targetElement.dispatchEvent(event);
};

export default FocusContainerHandler;
