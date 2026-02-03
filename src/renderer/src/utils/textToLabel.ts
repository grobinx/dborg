function textToLabel(text: string | string[] | null): string {
    if (text === null) return "";

    if (Array.isArray(text)) {
        let label = text.join(", ");
        if (label.length > 50 && text.length > 2) {
            const first = text[0];
            const last = text[text.length - 1];
            label = `${first}, ..., ${last}`;
        }
        return label;
    } else {
        if (text.length > 50) {
            return text.substring(0, 20) + "..." + text.substring(text.length - 20);
        }
        return text;
    }
}

export default textToLabel;