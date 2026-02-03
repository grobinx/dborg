function identifiersLabel(identifiers: string | string[] | null): string {
    if (identifiers === null) return "";

    if (Array.isArray(identifiers)) {
        let label = identifiers.join(", ");
        if (label.length > 50 && identifiers.length > 2) {
            const first = identifiers[0];
            const last = identifiers[identifiers.length - 1];
            label = `${first}, ..., ${last}`;
        }
        return label;
    } else {
        return identifiers;
    }
}

export default identifiersLabel;