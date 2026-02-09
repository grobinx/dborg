
export const acronym = (text: string, maxChars: number = 4): string => {
    const words = text.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    const digits = text.match(/\d/g);
    const hasExactlyOneDigit = digits && digits.length === 1;

    let acronym = words
        .map(word => word[0])
        .filter(char => !/\d/.test(char)) // skip digits in normal flow
        .slice(0, hasExactlyOneDigit ? maxChars - 1 : maxChars)
        .join('')
        .toUpperCase();

    if (hasExactlyOneDigit) {
        acronym += digits[0];
    }

    return acronym;
};
