
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

export const calculateTextWidth = (text: string, fontSize: number, font: string = 'Arial', weight: string = 'normal'): number | null => {
    if (!context) {
        console.error('Unable to get canvas context');
        return null;
    }
    context.font = `${weight} ${fontSize}px ${font}`; // Ustaw czcionkę i rozmiar
    const textMetrics = context.measureText(text);
    return textMetrics.width; // Zwróć szerokość tekstu
}

export default calculateTextWidth;
