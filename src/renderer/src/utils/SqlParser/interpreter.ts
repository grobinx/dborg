import { Token, TokenType } from "./tokenizer";

export type TokenMatchType =
    | "keyword"
    | "identifier"
    | "wild_identifier"
    | "operator"
    | "punctuator"
    | "string"
    | "number"
    | "repeat"
    | "alternative"
    | "reference";

export interface MatchBase {
    type: TokenMatchType;
    /**
     * Opcjonalny klucz który będzie używany do przekazania wartości dopasowanego tokena do funkcji akcji.
     * Jeśli nie zostanie podany, dopasowany token nie będzie przekazywany do funkcji akcji.
     */
    key?: string;
    /**
     * Czy token jest opcjonalny w sekwencji
     */
    optional?: boolean;
}

/**
 * Dopasowanie dla konkretnego słowa kluczowego (np. "SELECT"). Wzorzec będzie pasował tylko wtedy, gdy token jest słowem kluczowym i jego wartość dokładnie odpowiada podanemu słowu kluczowemu.
 */
export interface KeywordMatch extends MatchBase {
    type: "keyword";
    /**
     * Konkretne słowo kluczowe do dopasowania (np. "SELECT") lub lista synonimów słowa kluczowego (np. ["SELECT", "SEL", "S"]) - wzorzec będzie pasował, jeśli token jest słowem kluczowym i jego wartość dokładnie odpowiada któremukolwiek z podanych słów kluczowych.
     */
    value: string | string[];
}

/**
 * Dopasowanie dla identyfikatora (np. nazwy kolumny lub tabeli). Wzorzec będzie pasował tylko wtedy, gdy token jest identyfikatorem.
 */
export interface IdentifierMatch extends MatchBase {
    type: "identifier";
}

/**
 * Dopasowanie dla ciągu znaków wieloznacznych ("*" lub "_"). 
 * To ciąg znaków, który będzie użyty jako wzorzecz wyszukiwania. Dopuszcza znaki wieloznaczne.
 */
export interface WildIdentifierMatch extends MatchBase {
    type: "wild_identifier";
}

/**
 * Dopasowanie dla operatora (np. "+", "-", "=", "AND"). Wzorzec będzie pasował tylko wtedy, gdy token jest operatorem i jego wartość dokładnie odpowiada podanemu operatorowi lub znajduje się na liście dozwolonych operatorów.
 */
export interface OperatorMatch extends MatchBase {
    type: "operator";
    /**
     * Konkretny operator do dopasowania (np. "+") lub lista operatorów (np. ["+", "-"])
     */
    value?: string | string[];
}

/**
 * Dopasowanie dla znaku interpunkcyjnego (np. ",", "(", ")"). Wzorzec będzie pasował tylko wtedy, gdy token jest znakiem interpunkcyjnym i jego wartość dokładnie odpowiada podanemu znakowi lub znajduje się na liście dozwolonych znaków interpunkcyjnych.
 */
export interface PunctuatorMatch extends MatchBase {
    type: "punctuator";
    /**
     * Konkretny znak interpunkcyjny do dopasowania (np. ",") lub lista znaków (np. [",", ";"])
     */
    value?: string | string[];
}

/**
 * Dopasowanie dla ciągu znaków (np. 'text'). Wzorzec będzie pasował tylko wtedy, gdy token jest ciągiem znaków.
 */
export interface StringMatch extends MatchBase {
    type: "string";
    /**
     * Opcjonalny znak cudzysłowu, który otacza ciąg znaków (np. "'" lub '"'). Jeśli zostanie podany, wzorzec będzie pasował tylko wtedy, gdy ciąg znaków jest otoczony tym znakiem cudzysłowu.
     * @default "'"
     */
    open?: string;
    /**
     * Opcjonalny znak cudzysłowu, który zamyka ciąg znaków (np. "'" lub '"'). Jeśli zostanie podany, wzorzec będzie pasował tylko wtedy, gdy ciąg znaków jest zamknięty tym znakiem cudzysłowu.
     * @default "'"
     */
    close?: string;
    /**
     * Opcjonalny znak ucieczki używany wewnątrz ciągu znaków (np. "\" dla SQL lub "\" dla JavaScript). Jeśli zostanie podany, wzorzec będzie pasował tylko wtedy, gdy ciąg znaków używa tego znaku do ucieczki specjalnych znaków.
     * @default "\"
     */
    escape?: string;
}

/**
 * Dopasowanie dla liczby (np. 123, 3.14). Wzorzec będzie pasował tylko wtedy, gdy token jest liczbą.
 */
export interface NumberMatch extends MatchBase {
    type: "number";
}

/**
 * Dopasowanie dla powtarzającej się sekwencji tokenów (np. lista kolumn w instrukcji SELECT). Wzorzec będzie pasował, jeśli sekwencja tokenów zawiera zero lub więcej wystąpień określonej sekwencji tokenów, opcjonalnie otoczonej określającymi znakami (np. nawiasami) i oddzielonej określającym separatorem (np. przecinkiem).
 */
export interface RepeatMatch extends MatchBase {
    type: "repeat";
    /**
     * Opcjonalne otwierający znak powtarzającej się sekwencji (np. "(" dla listy kolumn)
     * @default "("
     */
    open?: string; // np. "("
    /**
     * Opcjonalne zamykający znak powtarzającej się sekwencji (np. ")" dla listy kolumn)
     * @default ")"
     */
    close?: string; // np. ")"
    /**
     * Opcjonalny separator między powtarzającymi się elementami (np. "," dla listy kolumn)
     * @default ","
     */
    separator?: string;
    /**
     * Sekwencja do powtórzenia
     * Przykład: dla listy kolumn "column1, column2, column3" sekwencja może wyglądać tak:
     * [
     *   { type: "identifier" }, // column name
     *  { type: "punctuator", value: "," } // separator
     * ]
     */
    sequence: TokenMatcher[];
}

/**
 * Dopasowanie dla alternatywnej sekwencji tokenów (np. różne warianty składni instrukcji). Wzorzec będzie pasował, jeśli któraś z alternatywnych sekwencji tokenów pasuje do tokenów.
 */
export interface AlternativeMatch extends MatchBase {
    type: "alternative";
    /**
     * Lista alternatywnych sekwencji. Wzorzec będzie pasował, jeśli któraś z tych sekwencji pasuje do tokenów.
     */
    options: TokenMatcher[][];
}

/**
 * Dopasowanie dla wzorca referencyjnego, który odwołuje się do innego wzorca zdefiniowanego w zestawie definicji. Wzorzec referencyjny będzie pasował, jeśli wzorzec o podanej nazwie pasuje do tokenów. Umożliwia to definiowanie złożonych wzorców poprzez odniesienie się do innych, wcześniej zdefiniowanych wzorców.
 */
export interface ReferenceMatch extends MatchBase {
    type: "reference";
    /**
     * Nazwa wzorca, do którego odwołuje się to dopasowanie. Wzorzec referencyjny będzie pasował, jeśli wzorzec o tej nazwie pasuje do tokenów.
     */
    name: string;
}

export type TokenMatcher =
    | KeywordMatch
    | IdentifierMatch
    | WildIdentifierMatch
    | OperatorMatch
    | PunctuatorMatch
    | StringMatch
    | NumberMatch
    | RepeatMatch
    | AlternativeMatch
    | ReferenceMatch;

/**
 * Definicje dla interpreterów, które pozwalają na definiowanie wzorców dopasowania sekwencji tokenów oraz funkcji akcji, które są wywoływane, gdy wzorzec pasuje do tokenów. Definicje te umożliwiają tworzenie elastycznych i rozbudowanych interpreterów do różnych języków i składni poprzez definiowanie zestawu wzorców i odpowiadających im funkcji akcji.
 */
export type MatchDefinition = {
    /**
     * Nazwa wzorca (np. "SelectStatement") - używana do identyfikacji, który wzorzec pasował
     */
    name: string;
    /**
     * Opcjonalna składnia lub format
     */
    syntax?: string;
    /**
     * Opis wzorca (np. "Wzorzec dla instrukcji SELECT")
     */
    description?: string;
    /**
     * Sekwencja tokenów do dopasowania. Każdy element może być konkretnym słowem kluczowym, operatorem, znakiem interpunkcyjnym lub ogólnym typem tokena (np. "identifier", "string"). Można też użyć typu "repeat" do zdefiniowania powtarzających się sekwencji (np. listy kolumn).
     */
    sequence: TokenMatcher[];
}

/**
 * Rozszerzenie MatchDefinition o funkcję akcji, która jest wywoływana, gdy wzorzec pasuje do sekwencji tokenów. Funkcja akcji otrzymuje obiekt zawierający wartości dopasowanych tokenów (z kluczami określonymi w dopasowaniach) i może wykonywać dowolne operacje, takie jak budowanie struktury drzewa składniowego, walidacja lub generowanie kodu.
 */
export interface ActionMatchDefinition<R = any> extends MatchDefinition {
    /**
     * Funkcja wywoływana, gdy wzorzec pasuje do sekwencji tokenów. Otrzymuje obiekt zawierający wartości dopasowanych tokenów i może wykonywać dowolne operacje, np. budować strukturę drzewa składniowego, wykonywać walidację lub generować kod.
     * @param values Obiekt zawierający wartości dopasowanych tokenów
     * @returns Wynik działania funkcji
     */
    action: (values: Record<string, any>) => Promise<R | null>;
}

export interface Definition<R = any> {
    /**
     * Nazwa zestawu definicji (np. "SQL")
     */
    name: string;
    /**
     * Opis zestawu definicji (np. "Zestaw definicji dla składni SQL")
     */
    description?: string;
    /**
     * Zbiór nazwanych wzorców, które mogą być używane jako referencje w dopasowaniach. Każdy wzorzec jest zdefiniowany przez nazwę i sekwencję tokenów do dopasowania. Wzorce te mogą być używane do tworzenia złożonych struktur składniowych poprzez odniesienie się do nich w innych dopasowaniach za pomocą typu "reference".
     */
    references: Record<string, MatchDefinition>;
    /**
     * Lista wzorców z funkcjami akcji, które będą sprawdzane podczas interpretacji tokenów. Każdy wzorzec zawiera nazwę, opcjonalny opis, sekwencję tokenów do dopasowania oraz funkcję akcji, która zostanie wywołana, gdy wzorzec pasuje do sekwencji tokenów. Funkcja akcji otrzymuje obiekt z wartościami dopasowanych tokenów i może wykonywać dowolne operacje, takie jak budowanie struktury drzewa składniowego, walidacja lub generowanie kodu.
     */
    actions: ActionMatchDefinition<R>[];
}

export class Interpreter<R = any> {
    private tokens: Token[]
    private position: number = 0;
    private definition: Definition<R>;

    constructor(tokens: Token[], definition: Definition<R>) {
        this.tokens = tokens.filter(token => token.type !== "whitespace" && token.type !== "comment");
        this.definition = definition;
    }

    /**
     * Uruchamia interpretarkę na sekwencji tokenów, próbując dopasować każdy z zdefiniowanych akcji wzorców.
     * Zwraca tablicę wyników dla każdej dopasowanej akcji.
     */
    public async interpret(): Promise<R | null> {
        // Pomiń tokeny whitespace
        this.skipWhitespace();

        // Próbuj dopasować każdy z definiowanych wzorców w sekwencji aż do końca tokenów
        while (this.position < this.tokens.length) {
            const savedPosition = this.position;

            // Spróbuj dopasować każdy z zdefiniowanych wzorców akcji
            for (const actionDef of this.definition.actions) {
                this.position = savedPosition;
                const values = this.matchSequence(actionDef.sequence);

                if (values !== null) {
                    // Wzorzec został dopasowany, wykonaj akcję
                    return await actionDef.action(values);
                }
            }

            this.position++;

            this.skipWhitespace();
        }

        return null;
    }

    /**
     * Próbuje dopasować sekwencję tokenów względem zdefiniowanej sekwencji matcherów.
     * Zwraca obiekt z wartościami dopasowanych tokenów (z kluczami), lub null jeśli nie pasuje.
     */
    private matchSequence(sequence: TokenMatcher[]): Record<string, any> | null {
        const values: Record<string, any> = {};
        const savedPosition = this.position;

        for (const matcher of sequence) {
            // Pomijaj whitespace przed każdym dopasowaniem
            this.skipWhitespace();

            const result = this.matchToken(matcher);

            if (result === null) {
                // Jeśli matcher jest opcjonalny, kontynuuj
                if ("optional" in matcher && matcher.optional) {
                    continue;
                }
                // Jeśli matcher nie jest opcjonalny i nie pasuje, przywróć pozycję i zwróć null
                this.position = savedPosition;
                return null;
            }

            // Dodaj wartość do obiektu wartości jeśli matcher ma przypisany klucz
            if (result !== undefined) {
                if ("key" in matcher && matcher.key) {
                    // Jeśli matcher ma klucz, przechowuj wynik pod tym kluczem
                    values[matcher.key] = result;
                } else if ((matcher.type === "alternative" || matcher.type === "reference") &&
                    typeof result === "object" &&
                    !Array.isArray(result)) {
                    // Dla alternative/reference bez klucza - scalaj wartości do parent
                    Object.assign(values, result);
                }
            }
        }

        return values;
    }

    /**
     * Próbuje dopasować pojedynczy token względem matchera.
     * Zwraca wartość dopasowanego tokena lub null jeśli nie pasuje.
     */
    private matchToken(matcher: TokenMatcher): any {
        // Jeśli bieżąca pozycja jest poza zakresem tokenów, zwróć null
        if (this.position >= this.tokens.length) {
            return null;
        }

        const token = this.tokens[this.position];

        switch (matcher.type) {
            case "keyword":
                return this.matchKeyword(token, matcher as KeywordMatch);
            case "identifier":
                return this.matchIdentifier(token, matcher as IdentifierMatch);
            case "wild_identifier":
                return this.matchWildIdentifier(matcher as WildIdentifierMatch);
            case "operator":
                return this.matchOperator(token, matcher as OperatorMatch);
            case "punctuator":
                return this.matchPunctuator(token, matcher as PunctuatorMatch);
            case "string":
                return this.matchString(token, matcher as StringMatch);
            case "number":
                return this.matchNumber(token, matcher as NumberMatch);
            case "repeat":
                return this.matchRepeat(matcher as RepeatMatch);
            case "alternative":
                return this.matchAlternative(matcher as AlternativeMatch);
            case "reference":
                return this.matchReference(matcher as ReferenceMatch);
            default:
                return null;
        }
    }

    /**
     * Dopasuj słowo kluczowe
     */
    private matchKeyword(token: Token, matcher: KeywordMatch): any {
        if (token.type !== "identifier" || token.quote) {
            return null;
        }

        // Załóż, że słowa kluczowe są identyfikatorami z wartością w uppercase
        const allowedValues = Array.isArray(matcher.value)
            ? matcher.value
            : [matcher.value];

        if (!allowedValues.some(value => value.toUpperCase() === token.value.toUpperCase())) {
            return null;
        }

        this.position++;
        return token.value;
    }

    /**
     * Dopasuj identyfikator
     */
    private matchIdentifier(token: Token, _matcher: IdentifierMatch): any {
        if (token.type !== "identifier") {
            return null;
        }

        this.position++;
        return { value: token.value, quoted: token.quote ? true : false };
    }

    /**
     * Dopasuj wildcard (znaki wieloznaczne)
     */
    private matchWildIdentifier(_matcher: WildIdentifierMatch): any {
        if (this.position >= this.tokens.length) {
            return null;
        }

        const isWildcardPiece = (t: Token): boolean => {
            if (t.type === "operator") {
                return t.value === "*" || t.value === "_";
            }
            if (t.type === "identifier") {
                // tylko niecytowane identyfikatory
                return "quote" in t && t.quote === false;
            }
            return false;
        };

        // pierwszy token też musi należeć do wildcarda
        if (!isWildcardPiece(this.tokens[this.position])) {
            return null;
        }

        let value = "";

        // łączymy aż do whitespace/comment lub końca albo innego typu tokena
        while (this.position < this.tokens.length) {
            const t = this.tokens[this.position];

            if (t.type === "whitespace" || t.type === "comment") {
                break;
            }

            if (!isWildcardPiece(t)) {
                break;
            }

            value += t.value;
            this.position++;
        }

        return value.length > 0 ? value : null;
    }

    /**
     * Dopasuj operator
     */
    private matchOperator(token: Token, matcher: OperatorMatch): any {
        if (token.type !== "operator") {
            return null;
        }

        // Jeśli matcher.value jest zdefiniowany, sprawdzaj czy pasuje
        if (matcher.value !== undefined) {
            const allowedValues = Array.isArray(matcher.value)
                ? matcher.value
                : [matcher.value];

            if (!allowedValues.includes(token.value)) {
                return null;
            }
        }

        this.position++;
        return token.value;
    }

    /**
     * Dopasuj znak interpunkcyjny
     */
    private matchPunctuator(token: Token, matcher: PunctuatorMatch): any {
        if (token.type !== "punctuator") {
            return null;
        }

        // Jeśli matcher.value jest zdefiniowany, sprawdzaj czy pasuje
        if (matcher.value !== undefined) {
            const allowedValues = Array.isArray(matcher.value)
                ? matcher.value
                : [matcher.value];

            if (!allowedValues.includes(token.value)) {
                return null;
            }
        }

        this.position++;
        return token.value;
    }

    /**
     * Dopasuj ciąg znaków
     */
    private matchString(token: Token, matcher: StringMatch): any {
        if (token.type !== "string") {
            return null;
        }

        // Domyślne wartości dla otwierającego i zamykającego znaku
        const open = matcher.open ?? "'";
        const close = matcher.close ?? "'";

        // Sprawdź czy token jest ciągiem znaków z odpowiednimi znakami cytowania
        if (token.type === "string" && "quote" in token) {
            const stringToken = token as any; // StringToken
            if (stringToken.quote !== open && stringToken.quote !== close) {
                return null;
            }
        }

        this.position++;
        return token.value;
    }

    /**
     * Dopasuj liczbę
     */
    private matchNumber(token: Token, _matcher: NumberMatch): any {
        if (token.type !== "number") {
            return null;
        }

        this.position++;
        return parseFloat(token.value);
    }

    /**
     * Dopasuj powtarzającą się sekwencję tokenów
     */
    private matchRepeat(matcher: RepeatMatch): any {
        const open = matcher.open ?? "(";
        const close = matcher.close ?? ")";
        const separator = matcher.separator ?? ",";

        const savedPosition = this.position;
        const results: any[] = [];

        // Sprawdź czy istnieje otwierający znak
        if (!this.expectPunctuator(open)) {
            // Jeśli nie ma otwierającego znaku, sprawdzenie nie powiedzie się
            this.position = savedPosition;
            return null;
        }

        this.skipWhitespace();

        // Jeśli następnie pojawia się zamykający znak, zwróć pustą tablicę
        if (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token.type === "punctuator" && token.value === close) {
                this.position++;
                return results;
            }
        }

        // Dopasuj sekwencje oddzielone separatorami
        while (true) {
            // Dopasuj sekwencję
            const values = this.matchSequence(matcher.sequence);

            if (values === null) {
                // Jeśli sekwencja się nie dopasuje, przestań
                break;
            }

            results.push(values);
            this.skipWhitespace();

            // Sprawdź czy następuje separator
            if (!this.expectPunctuator(separator)) {
                // Jeśli nie ma separatora, zakończ pętlę
                break;
            }

            this.skipWhitespace();
        }

        // Sprawdź czy istnieje zamykający znak
        if (!this.expectPunctuator(close)) {
            // Jeśli nie ma zamykającego znaku, przywróć pozycję i zwróć null
            this.position = savedPosition;
            return null;
        }

        return results;
    }

    /**
     * Dopasuj alternatywną sekwencję tokenów
     */
    private matchAlternative(matcher: AlternativeMatch): any {
        const savedPosition = this.position;

        // Spróbuj każdą alternatywę
        for (const option of matcher.options) {
            this.position = savedPosition;
            const values = this.matchSequence(option);

            if (values !== null) {
                // Jedna z alternatyw pasuje
                return values;
            }
        }

        // Żadna z alternatyw nie pasuje
        this.position = savedPosition;
        return null;
    }

    /**
     * Dopasuj referencję do innego wzorca
     */
    private matchReference(matcher: ReferenceMatch): any {
        // Pobierz referencyjny wzorzec z definicji
        const referencedDef = this.definition.references[matcher.name];

        if (!referencedDef) {
            console.warn(`Reference to undefined pattern: ${matcher.name}`);
            return null;
        }

        // Dopasuj sekwencję z wzorca referencyjnego
        return this.matchSequence(referencedDef.sequence);
    }

    /**
     * Oczekuj konkretnego punctuatora i przesunę pozycję jeśli pasuje
     */
    private expectPunctuator(value: string): boolean {
        if (this.position >= this.tokens.length) {
            return false;
        }

        const token = this.tokens[this.position];
        if (token.type === "punctuator" && token.value === value) {
            this.position++;
            return true;
        }

        return false;
    }

    private skipWhitespace(): void {
        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token.type !== "whitespace" && token.type !== "comment") {
                break;
            }
            this.position++;
        }
    }

    public static createMask(pattern: string | null): RegExp {
        if (pattern === null) {
            return /.*/;
        }
        return new RegExp(
            "^" +
            pattern
                .toUpperCase()
                .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
                .replace(/\*/g, ".*")
                .replace(/_/g, ".") +
            "$",
            "i"
        );
    }

    public static maskMatch(pattern: string | null, value: string): boolean {
        if (pattern === null) {
            return true;
        }
        return this.createMask(pattern).test(value.toUpperCase());
    }
}
