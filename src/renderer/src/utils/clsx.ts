
/**
 * Utility function to join class names conditionally.
 * It accepts strings, arrays, and objects to determine which class names to include.
 * 
 * @param args - arguments that can be strings, arrays, or objects
 * @returns class names string
 * 
 * @example
 * clsx('class1', ['class2', 'class3'], { 'class4': true, 'class5': false })
 * // => "class1 class2 class3 class4"
 * 
 * clsx('foo', true && 'bar', 'baz')
 * // => 'foo bar baz'
 * 
 * clsx({ foo: true, bar: false, baz: isTrue() })
 * // => 'foo baz'
 */
export function clsx(...args: any[]): string {
    const classes: string[] = [];

    const process = (item: any) => {
        if (!item) return; // Ignoruj wartości falsy (false, null, undefined, 0, '')
        if (typeof item === 'string') {
            classes.push(item); // Dodaj ciągi znaków
        } else if (Array.isArray(item)) {
            item.forEach(process); // Rekurencyjnie przetwarzaj tablice
        } else if (typeof item === 'object') {
            for (const key in item) {
                if (item[key]) {
                    classes.push(key); // Dodaj klucze, których wartości są truthy
                }
            }
        }
    };

    args.forEach(process); // Przetwarzaj wszystkie argumenty
    return classes.join(' '); // Połącz klasy w ciąg znaków
}

export default clsx;