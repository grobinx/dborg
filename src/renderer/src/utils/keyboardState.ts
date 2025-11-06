// KeyboardStateService.ts

class KeyboardStateService {
    private pressedKeys = new Set<string>();

    constructor() {
        this.init();
    }

    private init() {
        if (typeof window === 'undefined') return;
        window.addEventListener('keydown', this.handleKeyDown, true);
        window.addEventListener('keyup', this.handleKeyUp, true);
        window.addEventListener('blur', this.handleBlur, true);
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        this.pressedKeys.add(e.key);
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.pressedKeys.delete(e.key);
    };

    private handleBlur = () => {
        this.pressedKeys.clear();
    };

    isPressed(key: string) {
        return this.pressedKeys.has(key);
    }

    get shiftPressed() {
        return this.isPressed('Shift');
    }
    get ctrlPressed() {
        return this.isPressed('Control');
    }
    get altPressed() {
        return this.isPressed('Alt');
    }
    get metaPressed() {
        return this.isPressed('Meta');
    }
    get pressed() {
        return Array.from(this.pressedKeys);
    }
}

export const keyboardState = new KeyboardStateService();