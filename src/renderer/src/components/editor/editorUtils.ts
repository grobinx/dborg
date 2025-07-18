import * as monaco from "monaco-editor";

export function changeCaseExceptQuotes(input: string, toUpper: boolean): string {
    let result = "";
    let insideQuotes = false; // Flaga wskazująca, czy jesteśmy wewnątrz cudzysłowów lub apostrofów
    let quoteChar = ""; // Przechowuje aktualny znak cudzysłowu (' lub ")
    let insideComment: "line" | "block" | false = false; // Flaga wskazująca, czy jesteśmy wewnątrz komentarza

    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const prevChar = i > 0 ? input[i - 1] : null;
        const nextChar = i < input.length - 1 ? input[i + 1] : null;

        // Sprawdź, czy wchodzimy w komentarz liniowy
        if (!insideQuotes && !insideComment && char === "-" && nextChar === "-") {
            insideComment = "line";
        }

        // Sprawdź, czy wchodzimy w komentarz blokowy
        if (!insideQuotes && !insideComment && char === "/" && nextChar === "*") {
            insideComment = "block";
        }

        // Sprawdź, czy wychodzimy z komentarza blokowego
        if (insideComment === "block" && char === "*" && nextChar === "/") {
            insideComment = false;
            result += char + nextChar;
            i++;
            continue;
        }

        // Sprawdź, czy kończymy komentarz liniowy
        if (insideComment === "line" && char === "\n") {
            insideComment = false;
        }

        if (insideComment) {
            result += char;
            continue;
        }

        if ((char === '"' || char === "'") && prevChar !== "\\") {
            if (insideQuotes && char === quoteChar) {
                // Zamykamy cudzysłów/apostrof
                insideQuotes = false;
                quoteChar = "";
            } else if (!insideQuotes) {
                // Otwieramy cudzysłów/apostrof
                insideQuotes = true;
                quoteChar = char;
            }
            result += char; // Dodajemy znak cudzysłowu/apostrofu bez zmian
        } else if (insideQuotes) {
            // Jeśli jesteśmy wewnątrz cudzysłowów/apostrofów, dodajemy znak bez zmian
            result += char;
        } else {
            // Poza cudzysłowami/apostrofami zamieniamy na wielkie lub małe litery w zależności od parametru
            result += toUpper ? char.toUpperCase() : char.toLowerCase();
        }
    }

    return result;
}


export const selectFragmentAroundCursor = (editor: monaco.editor.IStandaloneCodeEditor) => {
    if (!editor) {
        return;
    }

    const model = editor.getModel();
    if (!model) return;

    const position = editor.getPosition(); // Bieżąca pozycja kursora
    if (!position) return;

    const lineCount = model.getLineCount();
    const currentLine = position.lineNumber;

    // Znajdź górną granicę (pierwsza pusta linia powyżej kursora)
    let startLine = currentLine;
    while (startLine > 1 && model.getLineContent(startLine - 1).trim() !== "") {
        startLine--;
    }

    // Znajdź dolną granicę (pierwsza pusta linia poniżej kursora)
    let endLine = currentLine;
    while (endLine < lineCount && model.getLineContent(endLine + 1).trim() !== "") {
        endLine++;
    }

    // Stwórz zakres do zaznaczenia
    const range = new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine));

    // Ustaw zaznaczenie w edytorze
    editor.setSelection(range);
};

/**
 * Znajduje początek i koniec ciągu znaków wokół kursora.
 * @param model Model edytora Monaco.
 * @param currentLine Bieżący numer linii kursora.
 * @returns Obiekt z numerami linii `startLine` i `endLine`.
 */
export const findFragmentBounds = (model: monaco.editor.ITextModel, currentLine: number) => {
    const lineCount = model.getLineCount();

    // Jeśli bieżąca linia jest pusta, zdecyduj, czy szukać powyżej, poniżej, czy w bieżącej linii
    if (model.getLineContent(currentLine).trim() === "") {
        let aboveLine = currentLine - 1;
        let belowLine = currentLine + 1;

        // Szukaj najbliższego niepustego zapytania powyżej
        while (aboveLine > 0 && model.getLineContent(aboveLine).trim() === "") {
            aboveLine--;
        }

        // Szukaj najbliższego niepustego zapytania poniżej
        while (belowLine <= lineCount && model.getLineContent(belowLine).trim() === "") {
            belowLine++;
        }

        // Jeśli znaleziono zapytanie powyżej i poniżej, wybierz bliższe
        if (aboveLine > 0 && belowLine <= lineCount) {
            const distanceAbove = currentLine - aboveLine;
            const distanceBelow = belowLine - currentLine;

            if (distanceAbove <= distanceBelow) {
                return findFragmentBounds(model, aboveLine);
            } else {
                return findFragmentBounds(model, belowLine);
            }
        }

        // Jeśli znaleziono tylko zapytanie powyżej
        if (aboveLine > 0) {
            return findFragmentBounds(model, aboveLine);
        }

        // Jeśli znaleziono tylko zapytanie poniżej
        if (belowLine <= lineCount) {
            return findFragmentBounds(model, belowLine);
        }
    }

    // Znajdź górną granicę (pierwsza pusta linia powyżej kursora)
    let startLine = currentLine;
    while (startLine > 1 && model.getLineContent(startLine - 1).trim() !== "") {
        startLine--;
    }

    // Znajdź dolną granicę (pierwsza pusta linia poniżej kursora)
    let endLine = currentLine;
    while (endLine < lineCount && model.getLineContent(endLine + 1).trim() !== "") {
        endLine++;
    }

    return { startLine, endLine };
};

/**
 * Funkcja ta znajduje fragment tekstu wokół kursora w edytorze Monaco.
 * @param editor Edytor Monaco.
 * @returns Fragment tekstu wokół kursora.
 */
export const getFragmentAroundCursor = (editor: monaco.editor.IStandaloneCodeEditor, position?: monaco.Position) => {
    if (!editor) {
        return;
    }

    const model = editor.getModel();
    if (!model) return;

    position = position ?? editor.getPosition() ?? undefined; // Bieżąca pozycja kursora
    if (!position) return;

    const currentLine = position.lineNumber;

    const { startLine, endLine } = findFragmentBounds(model, currentLine);

    // Pobierz tekst w zakresie
    const range = new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine));
    const fragment = model.getValueInRange(range);

    return { 
        fragment, 
        startLine,
        endLine,
        relativeOffset: model.getOffsetAt(position) - model.getOffsetAt({ lineNumber: startLine, column: 1 })
    };
};

/**
 * Funkcja ta sprawdza, czy kursor znajduje się wewnątrz ciągu znaków (single/double quotes).
 * Funkcja ogranicza fragment do ciągu znaków pomiędzy pustymi liniami.
 * @param model Edytor Monaco.
 * @param position Pozycja kursora w modelu.
 * @param startLine Numer linii, od której zaczyna się fragment.
 * @param endLine Numer linii, na której kończy się fragment.
 * @returns Typ ciągu znaków: "single", "double" lub null.
 */
export const getStringTypeAroundCursor = (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    startLine: number,
    endLine: number
): "single" | "double" | null => {
    // Pobierz tekst w zakresie od startLine do endLine
    const range = new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine));
    const fragment = model.getValueInRange(range);

    // Oblicz pozycję kursora w fragmencie
    const cursorOffset =
        fragment.split("\n").slice(0, position.lineNumber - startLine).join("\n").length +
        position.column -
        1;

    // Licz apostrofy i cudzysłowy przed kursosem
    const textBeforeCursor = fragment.substring(0, cursorOffset);
    const singleQuoteCount = (textBeforeCursor.match(/'/g) || []).length;
    const doubleQuoteCount = (textBeforeCursor.match(/"/g) || []).length;

    // Sprawdź, czy kursor znajduje się wewnątrz ciągu znaków
    const inSingleQuotes = singleQuoteCount % 2 !== 0;
    const inDoubleQuotes = doubleQuoteCount % 2 !== 0;

    if (inSingleQuotes) {
        return "single";
    }

    if (inDoubleQuotes) {
        return "double";
    }

    return null; // Kursor nie znajduje się w żadnym ciągu znaków
};

/**
 * Sprawdza, czy dane słowo jest aliasem tabeli w fragmencie SQL i zwraca nazwę tabeli.
 * @param fragment Fragment SQL do analizy.
 * @param word Słowo do sprawdzenia.
 * @returns Nazwę tabeli, jeśli słowo jest aliasem; w przeciwnym razie zwraca dane słowo.
 */
export const resolveWordAlias = (fragment: string, word: string) => {
    // Podziel fragment na linie i przeszukaj definicje aliasów
    const lines = fragment.split("\n");

    for (const line of lines) {
        // Dopasowanie aliasu w klauzuli "AS" lub bezpośrednio po nazwie tabeli
        const aliasMatch = line.match(new RegExp(`\\b(\\w+)(?:\\.(\\w+))?\\s+(?:AS\\s+)?\\b${word}\\b(?!\\.)`, "i"));
        if (aliasMatch) {
            const spaceName = aliasMatch[1]; // Opcjonalna nazwa schematu
            const objectName = aliasMatch[2] || aliasMatch[1]; // Nazwa tabeli lub schematu
            
            return { 
                spaceName: spaceName !== objectName ? spaceName : undefined, 
                objectName 
            }
        }
    }

    return {};
};

/**
 * Pobiera poprzedzające słowo przed kropką w bieżącej linii.
 * @param model Model edytora Monaco.
 * @param position Pozycja kursora w edytorze.
 * @returns Poprzedzające słowo przed kropką lub `null`, jeśli nie znaleziono.
 */
export const getPrevNeighbor = (model: monaco.editor.ITextModel, position: monaco.Position): string | null => {
    // Pobierz tekst bieżącej linii
    const lineContent = model.getLineContent(position.lineNumber);

    // Wyodrębnij tekst przed bieżącym słowem
    const textBeforeWord = lineContent.substring(0, position.column - 1);

    // Dopasuj poprzedzające słowo przed kropką
    const match = textBeforeWord.match(/(\w+)\.(\w+)?$/); // Szuka wzorca "słowo.kropka"
    return match ? match[1] : null;
};

/**
 * Pobiera następne słowo po kropce w bieżącej linii.
 * @param model Model edytora Monaco.
 * @param position Pozycja kursora w edytorze.
 * @returns Następne słowo po kropce lub `null`, jeśli nie znaleziono.
 */
export const getNextNeighbor = (model: monaco.editor.ITextModel, position: monaco.Position): string | null => {
    // Pobierz tekst bieżącej linii
    const lineContent = model.getLineContent(position.lineNumber);

    // Wyodrębnij tekst po bieżącym słowie
    const textAfterWord = lineContent.substring(position.column);

    // Dopasuj następne słowo po kropce
    const match = textAfterWord.match(/^(\w+)?\.\s*(\w+)/); // Szuka wzorca ".słowo"
    return match ? match[2] : null;
};
