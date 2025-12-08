import { Mutex } from "async-mutex";
import { DBORG_EDITORS_PATH_NAME } from "../../../../src/api/dborg-path";
import { EditorEncoding, EditorEolMode, EditorLanguageId } from "@renderer/components/editor/MonacoEditor";

export interface ContentState {
    editorId: string;
    schemaId: string;
    loaded: boolean;
    saved: boolean;
    content?: string;
}

interface CursorPosition {
    top: number;
    line: number;
    column: number;
}

export interface EditorsState {
    schemaId: string;
    activeId: string | null;
    editors: EditorState[];
}

function isEditorsState(obj: any): obj is EditorsState {
    return obj && typeof obj === "object" && "schemaId" in obj && "activeId" in obj && "editors" in obj;
}

export interface EditorState {
    editorId: string;
    schemaId: string;
    label: string | null;
    type: string;
    position: CursorPosition;
    lines: number;
    sampleLines: string;
    fileName: string;
    open: boolean;
    lastModified: number;
    order?: number;
    externalPath?: string;
    language?: EditorLanguageId;
    encoding?: EditorEncoding;
    eol?: EditorEolMode;
}

export const editorExtLanguages: Partial<Record<EditorLanguageId, string[]>> = {
    sql: [
        "sql", "psql", "pgsql", "mysql", "sqlite", "db2", "tsql", "mssql", "ora", "plsql",
        "hql", "cql", "dbql", "script", "dsql", "ibsql", "isql", "out", "dump"
    ],
    java: ["java"],
    javascript: ["js", "jsx"],
    typescript: ["ts", "tsx"],
    python: ["py"],
    json: ["json"],
    xml: ["xml"],
    yaml: ["yaml", "yml"],
    csharp: ["cs"],
    php: ["php"],
    ruby: ["rb"],
    go: ["go"],
    css: ["css", "scss", "less"],
    shell: ["sh", "bash", "zsh"],
    html: ["html", "htm", "xhtml", "svg", "mhtml"],
    less: ["less"],
    markdown: ["md", "markdown"],
    plaintext: ["txt", "text", "log"],
    powershell: ["ps1", "psm1"],
    scss: ["scss"],
};

export interface IEditorContentManager {
    /**
     * Pobiera stan edytora na podstawie jego identyfikatora.
     * @param editorId - Identyfikator edytora.
     * @returns Obiekt `EditorState` lub `null`, jeśli nie istnieje.
     */
    getState: (editorId: string) => EditorState | null;

    /**
     * Pobiera wszystkie stany edytorów.
     * Jeśli stany nie zostały jeszcze załadowane, metoda je ładuje.
     * @returns Tablica obiektów `EditorState`.
     */
    getStates: () => Promise<EditorState[]>;

    /**
     * Ustawia nazwę pliku dla danego edytora.
     * @param editorId - Identyfikator edytora.
     * @param fileName - Nowa nazwa pliku.
     */
    setFileName: (editorId: string, fileName: string) => void;

    /**
     * Pobiera nazwę pliku dla danego edytora.
     * @param editorId - Identyfikator edytora.
     * @returns Nazwa pliku jako `string`.
     */
    getFileName: (editorId: string) => string;

    /**
     * Ustawia flagę otwarcia dla danego edytora.
     * @param editorId - Identyfikator edytora.
     * @param open - Flaga określająca, czy edytor jest otwarty.
     */
    setOpen: (editorId: string, open: boolean) => void;

    /**
     * Sprawdza, czy dany edytor jest otwarty.
     * @param editorId - Identyfikator edytora.
     * @returns `true`, jeśli edytor jest otwarty, w przeciwnym razie `false`.
     */
    isOpen: (editorId: string) => boolean;

    /**
     * Ustawia aktywny edytor.
     * @param editorId 
     * @returns 
     */
    setActive: (editorId: string) => void;

    /**
     * Pobiera identyfikator aktywnego edytora.
     * @returns Identyfikator aktywnego edytora lub `null`, jeśli brak aktywnego edytora.
     */
    getActive: () => string | null;

    /**
     * Ustawia typ edytora.
     * @param editorId - Identyfikator edytora.
     * @param type - Typ edytora.
     */
    setType: (editorId: string, type: string) => void;

    /**
     * Pobiera typ edytora.
     * @param editorId - Identyfikator edytora.
     * @returns Typ edytora jako `string`.
     */
    getType: (editorId: string) => string;

    /**
     * Ustawia etykietę dla danego edytora.
     * @param editorId - Identyfikator edytora.
     * @param label - Nowa etykieta.
     */
    setLabel: (editorId: string, label: string | null) => void;

    /**
     * Pobiera etykietę dla danego edytora.
     * @param editorId - Identyfikator edytora.
     * @returns Etykieta jako `string`.
     */
    getLabel: (editorId: string) => string | null;

    /**
     * Ustawia pozycję kursora w edytorze.
     * @param editorId - Identyfikator edytora.
     * @param position - Nowa pozycja kursora.
     */
    setPosition: (editorId: string, position: CursorPosition) => void;

    /**
     * Pobiera pozycję kursora w edytorze.
     * @param editorId - Identyfikator edytora.
     * @returns Pozycja kursora jako `number`.
     */
    getPosition: (editorId: string) => CursorPosition;

    /**
     * Pobiera czas ostatniej modyfikacji zawartości edytora.
     * @param editorId - Identyfikator edytora.
     * @returns Czas ostatniej modyfikacji jako `number` (timestamp).
     */
    getLastModified: (editorId: string) => number;

    /**
     * Ustawia język edytora.
     * @param editorId 
     * @param language 
     */
    setLanguage(editorId: string, language: EditorLanguageId): void;

    /**
     * Pobiera język edytora.
     * @param editorId 
     * @returns 
     */
    getLanguage(editorId: string): EditorLanguageId | null;

    /**
     * Ustawia kodowanie edytora.
     * @param editorId
     * @param encoding
     */
    setEncoding(editorId: string, encoding: EditorEncoding): void;

    /**
     * Pobiera kodowanie edytora.
     * @param editorId
     * @returns
     */
    getEncoding(editorId: string): EditorEncoding | null;

    /**
     * Ustawia tryb końca linii edytora.
     * @param editorId
     * @param eol
     */
    setEol(editorId: string, eol: EditorEolMode): void;

    /**
     * Pobiera tryb końca linii edytora.
     * @param editorId
     * @returns
     */
    getEol(editorId: string): EditorEolMode | null;

    /**
     * Ustawia zewnętrzną ścieżkę pliku dla danego edytora.
     * Akcja zamienia plik wewnętrzny na zewnętrzny. Jest to proces nieodwracalny.
     * Ustawienie pliku automatycznie zapisuje zawartość w nowym pliku, wewnętrzny zostaje usunięty.
     * @param editorId - Identyfikator edytora.
     * @param externalFilePath - Zewnętrzna ścieżka pliku
     */
    setExternalFile: (editorId: string, externalFilePath: string) => Promise<void>;

    /**
     * Pobiera zewnętrzną ścieżkę pliku dla danego edytora.
     * @param editorId - Identyfikator edytora.
     * @returns Zewnętrzna ścieżka pliku jako `string` lub `undefined`.
     */
    getExternalPath: (editorId: string) => string | undefined;

    /**
     * Pobiera zawartość edytora.
     * Jeśli zawartość nie została załadowana, metoda ją ładuje.
     * @param editorId - Identyfikator edytora.
     * @returns Zawartość edytora jako `Promise<string>`.
     */
    getContent: (editorId: string) => Promise<string>;

    /**
     * Ustawia zawartość edytora.
     * Jeśli `ContentState` dla danego `editorId` nie istnieje, zostanie utworzony.
     * @param editorId - Identyfikator edytora.
     * @param content - Nowa zawartość edytora.
     */
    setContent: (editorId: string, content: string, position: number) => void;

    /**
     * Pobiera wszystkie stany zawartości.
     * @returns Tablica obiektów `ContentState`.
     */
    getContents: () => ContentState[];

    /**
     * Sprawdza, czy zawartość edytora została zapisana.
     * @param editorId - Identyfikator edytora.
     * @returns `true`, jeśli zawartość została zapisana, w przeciwnym razie `false`.
     */
    isContentSaved: (editorId: string) => boolean;

    /**
     * Czyści wszystkie stany edytorów i zawartości.
     */
    clear: () => void;

    /**
     * Usuwa stan edytora i zawartości dla danego `editorId`.
     * Chyba, że jest to plik zewnętrzny, wtedy usuwa tylko stan.
     * @param editorId - Identyfikator edytora.
     */
    remove: (editorId: string) => Promise<void>;

    /**
     * Ładuje stany edytorów z pliku.
     * Jeśli stany zostały już załadowane, metoda nic nie robi.
     */
    loadStates: () => Promise<void>;

    /**
     * Zapisuje stany edytorów do pliku.
     */
    saveStates: () => Promise<void>;

    /**
     * Ładuje zawartość edytora z pliku.
     * @param editorId - Identyfikator edytora.
     * @returns Zawartość edytora jako `Promise<string>`.
     */
    loadContent: (editorId: string) => Promise<string>;

    /**
     * Zapisuje zawartość edytora do pliku.
     * @param editorId - Identyfikator edytora.
     */
    saveContent: (editorId: string) => Promise<void>;

    /**
     * Wykonuje zapis wszystkich zmienionych stanów edytorów i zawartości.
     */
    performSave: () => Promise<void>;

    /**
     * Dodaje nowy edytor do menedżera.
     * @param editorId - Identyfikator edytora.
     * @param type 
     * @param filePath - Opcjonalna ścieżka do zewnętrznego pliku.
     */
    addEditor(editorId: string, type?: string, filePath?: string): Promise<void>;

    reorder(): void;

    /**
     * Subskrybuje zmiany określonej właściwości edytora.
     * @param editorId - Identyfikator edytora.
     * @param property - Właściwość do obserwacji.
     * @param callback - Funkcja wywoływana przy zmianie właściwości.
     * @returns Funkcja do odsubskrybowania zmian.
     */
    onStateChange: (editorId: string, property: keyof EditorState | "content" | "saved", callback: (value: any) => void) => () => void;
}

let editorsBaseDir: string | null = null;
(async () => {
    editorsBaseDir = await window.dborg.path.get(DBORG_EDITORS_PATH_NAME);
})();

type EditorPropertySubscriber = (value: any) => void;

class EditorContentManager implements IEditorContentManager {
    private schemaId: string;
    private activeEditorId: string | null = null;
    private baseDir: string;
    private statesFile: string;
    private editorStates: Map<string, EditorState>;
    private contentStates: Map<string, ContentState>;
    private saveTimeout: NodeJS.Timeout | null; // Zmienna dla globalnego timeoutu
    private editorsSaved: boolean;
    private editorsLoaded: boolean;
    private typeChangeLock: Set<string> = new Set();
    private mutex: Mutex = new Mutex(); // Mutex do synchronizacji

    // Mapowanie: editorId -> property -> Set<callback>
    private propertySubscribers: Map<string, Map<keyof EditorState | "content" | "saved", Set<EditorPropertySubscriber>>> = new Map();

    constructor(schemaId: string) {
        this.schemaId = schemaId;
        this.baseDir = editorsBaseDir + "/" + this.schemaId;
        this.statesFile = `${this.baseDir}/editors.json`;
        this.editorStates = new Map();
        this.contentStates = new Map();
        this.saveTimeout = null; // Inicjalizacja zmiennej timeoutu
        this.editorsSaved = true;
        this.editorsLoaded = false;
        this.activeEditorId = null;
    }

    private normalizePath(path: string): string {
        return path.replace(/\\/g, "/");
    }

    private splitPath(filePath: string): { normalizedPath: string, dir: string; fileName: string, ext: string | undefined } {
        const normalizedPath = this.normalizePath(filePath);
        const dir = normalizedPath.substring(0, normalizedPath.lastIndexOf("/"));
        const fileName = normalizedPath.substring(normalizedPath.lastIndexOf("/") + 1);
        const ext = fileName.split(".").pop();
        return { normalizedPath, dir, fileName, ext };
    }

    async loadStates(): Promise<void> {
        if (this.editorsLoaded) {
            return; // Jeśli stany zostały już załadowane, zakończ metodę
        }

        await this.mutex.runExclusive(async () => {
            let editorsStates: EditorsState | null = null;
            let states: EditorState[] = [];
            if (await window.dborg.file.exists(this.statesFile)) {
                const data = await window.dborg.file.readFile(this.statesFile);
                const parsed = JSON.parse(data);
                if (isEditorsState(parsed)) {
                    editorsStates = parsed;
                    states = editorsStates.editors;
                    this.activeEditorId = editorsStates.activeId;
                }
                else if (Array.isArray(parsed)) {
                    states = parsed as EditorState[];
                }
            }

            states.forEach(state => {
                this.editorStates.set(state.editorId, state);

                // Upewnij się, że istnieje odpowiadający ContentState
                if (!this.contentStates.has(state.editorId)) {
                    this.contentStates.set(state.editorId, {
                        editorId: state.editorId,
                        schemaId: this.schemaId,
                        loaded: false,
                        saved: false,
                    });
                }
            });
            this.editorsLoaded = true; // Ustawienie flagi załadowania
        });
    }

    async saveStates(): Promise<void> {
        const states = Array.from(this.editorStates.values());
        await window.dborg.path.ensureDir(this.baseDir);
        const editorsStates: EditorsState = {
            schemaId: this.schemaId,
            activeId: this.activeEditorId,
            editors: states,
        };
        //await window.dborg.file.writeFile(this.statesFile, JSON.stringify(states, null, 2));
        await window.dborg.file.writeFile(this.statesFile, JSON.stringify(editorsStates, null, 2));
        this.editorsSaved = true; // Ustawienie flagi zapisania
    }

    async loadContent(editorId: string): Promise<string> {
        const editorState = this.editorStates.get(editorId);
        if (!editorState) {
            throw new Error(`EditorState not found for editorId: ${editorId}`);
        }

        const path = editorState.externalPath ?? this.baseDir;
        const filePath = `${path}/${editorState.fileName}`;

        // Sprawdzenie, czy plik istnieje
        const fileExists = await window.dborg.file.exists(filePath);
        const content = fileExists ? await window.dborg.file.readFile(filePath) : "";

        // Tworzenie lub aktualizacja stanu zawartości
        const contentState: ContentState = {
            editorId,
            schemaId: this.schemaId,
            loaded: true,
            saved: true,
            content: content,
        };
        this.contentStates.set(editorId, contentState);

        this.updateEditorState(editorId, state => {
            state.lastModified = Date.now();
        });

        return content;
    }

    async saveContent(editorId: string): Promise<void> {
        const contentState = this.contentStates.get(editorId);
        if (!contentState) {
            throw new Error(`ContentState not found for editorId: ${editorId}`);
        }
        const editorState = this.editorStates.get(editorId);
        if (!editorState) {
            throw new Error(`EditorState not found for editorId: ${editorId}`);
        }
        if (!contentState.loaded) {
            return; // Jeśli zawartość nie została załadowana, zakończ metodę
        }

        const path = editorState.externalPath ?? this.baseDir;
        const filePath = `${path}/${editorState.fileName}`;
        const content = contentState.content || ""; // Pobierz zawartość do zapisania
        await window.dborg.path.ensureDir(path);
        await window.dborg.file.writeFile(filePath, content);

        contentState.saved = true;

        this.notifyPropertyChange(editorId, "saved", content);
    }

    getState(editorId: string): EditorState | null {
        return this.editorStates.get(editorId) || null;
    }

    async getStates(): Promise<EditorState[]> {
        if (!this.editorsLoaded) {
            await this.loadStates(); // Załaduj stany, jeśli jeszcze nie zostały załadowane
        }
        // Posortuj stany według pola `order`
        return Array.from(this.editorStates.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    setFileName(editorId: string, fileName: string): void {
        this.updateEditorState(editorId, state => {
            state.fileName = fileName;
        });
    }

    getFileName(editorId: string): string {
        const state = this.getState(editorId);
        return state ? state.fileName : "";
    }

    setOpen(editorId: string, open: boolean): void {
        this.updateEditorState(editorId, state => {
            state.open = open;
        }, true);
    }

    isOpen(editorId: string): boolean {
        const state = this.getState(editorId);
        return state ? state.open : false;
    }

    setActive(editorId: string): void {
        this.activeEditorId = editorId;
        this.editorsSaved = false;
        this.scheduleSave();
    }

    getActive(): string | null {
        return this.activeEditorId;
    }

    async setType(editorId: string, type: string): Promise<void> {
        if (this.typeChangeLock.has(editorId)) {
            throw new Error(`Type change is already in progress for editorId: ${editorId}`);
        }

        this.typeChangeLock.add(editorId);

        try {
            const state = this.getState(editorId);
            if (!state) {
                throw new Error(`Editor state not found for editorId: ${editorId}`);
            }

            if (state.type !== type) {
                const oldFileName = state.fileName;
                const newFileName = `${editorId}.${type}`;
                const path = state.externalPath ?? this.baseDir;
                const oldFilePath = `${path}/${oldFileName}`;
                const newFilePath = `${path}/${newFileName}`;

                // Zmień nazwę pliku na systemie plików, jeśli istnieje
                if (await window.dborg.file.exists(oldFilePath)) {
                    await window.dborg.file.renameFile(oldFilePath, newFilePath);
                }

                // Zaktualizuj nazwę pliku i typ w stanie edytora
                this.updateEditorState(editorId, state => {
                    state.fileName = newFileName;
                    state.type = type;
                });

                // Oznacz edytory jako wymagające zapisu
                this.editorsSaved = false;

                // Zleć zapis stanu edytora
                this.scheduleSave();
            }
        } finally {
            this.typeChangeLock.delete(editorId);
        }
    }

    getType(editorId: string): string {
        const state = this.getState(editorId);
        return state ? state.type : "";
    }

    setLabel(editorId: string, label: string | null): void {
        this.updateEditorState(editorId, state => {
            state.label = label;
        });
    }

    getLabel(editorId: string): string | null {
        const state = this.getState(editorId);
        return state ? state.label : null;
    }

    setPosition(editorId: string, position: CursorPosition): void {
        this.updateEditorState(editorId, state => {
            state.position = position;
        });
    }

    getPosition(editorId: string): CursorPosition {
        const state = this.getState(editorId);
        return state ? state.position : { top: 0, line: 0, column: 0 };
    }

    getLastModified(editorId: string): number {
        const editorState = this.editorStates.get(editorId);
        return editorState ? editorState.lastModified : 0;
    }

    setLanguage(editorId: string, language: EditorLanguageId): void {
        this.updateEditorState(editorId, state => {
            state.language = language;
        });
    }

    getLanguage(editorId: string): EditorLanguageId | null {
        const state = this.getState(editorId);
        return state?.language ?? null;
    }

    setEncoding(editorId: string, encoding: EditorEncoding): void {
        this.updateEditorState(editorId, state => {
            state.encoding = encoding;
        });
    }

    getEncoding(editorId: string): EditorEncoding | null {
        const state = this.getState(editorId);
        return state?.encoding ?? null;
    }

    setEol(editorId: string, eol: EditorEolMode): void {
        this.updateEditorState(editorId, state => {
            state.eol = eol;
        });
    }

    getEol(editorId: string): EditorEolMode | null {
        const state = this.getState(editorId);
        return state?.eol ?? null;
    }

    async setExternalFile(editorId: string, externalFilePath: string): Promise<void> {
        const { dir: externalPath, fileName, ext, normalizedPath } = this.splitPath(externalFilePath);

        if (normalizedPath !== `${externalPath ?? this.baseDir}/${this.getFileName(editorId)}`) {
            // Zapisz aktualną zawartość do nowego pliku zewnętrznego
            const content = await this.getContent(editorId);
            await window.dborg.path.ensureDir(externalPath);
            await window.dborg.file.writeFile(normalizedPath, content);

            // Usuń stary plik wewnętrzny/zewnętrzny
            await window.dborg.file.deleteFile(`${externalPath ?? this.baseDir}/${this.getFileName(editorId)}`);

            this.updateEditorState(editorId, state => {
                state.externalPath = externalPath;
                state.fileName = fileName;
                state.type = ext ?? "txt";
            });

            await this.saveStates();
        }
    }

    getExternalPath(editorId: string): string | undefined {
        const state = this.getState(editorId);
        return state ? state.externalPath : undefined;
    }

    async getContent(editorId: string): Promise<string> {
        const contentState = this.contentStates.get(editorId);
        if (!contentState || !contentState.loaded) {
            return await this.loadContent(editorId); // Return the loaded content
        }
        return contentState.content || ""; // Return the existing content or an empty string if undefined
    }

    setContent(editorId: string, content: string): void {
        let contentState = this.contentStates.get(editorId);

        if (!contentState) {
            contentState = {
                editorId,
                schemaId: this.schemaId,
                loaded: true,
                saved: false,
                content: content,
            };
            this.contentStates.set(editorId, contentState);
        } else {
            contentState.content = content;
            contentState.saved = false;
        }

        const lines = content.split("\n");
        const lineCount = lines.length;

        // Pobierz stan edytora
        let editorState = this.editorStates.get(editorId);
        if (!editorState) {
            editorState = {
                editorId,
                schemaId: this.schemaId,
                label: null,
                type: "txt", // Domyślny typ, jeśli nie istnieje
                position: { top: 0, line: 0, column: 0 }, // Domyślna pozycja
                lines: lineCount,
                sampleLines: "",
                fileName: `${editorId}.txt`,
                open: false,
                lastModified: Date.now(),
            };
            this.editorStates.set(editorId, editorState);
        }

        // Użyj pozycji wiersza z `position.line`
        const currentLineIndex = editorState.position.line;

        // Pobierz 4 poprzednie i 4 następne wiersze względem bieżącej linii
        const startLine = Math.max(0, currentLineIndex - 4);
        const endLine = Math.min(lineCount, currentLineIndex + 5); // +5, ponieważ `slice` nie obejmuje końca
        const sampleLines = lines.slice(startLine, endLine).join("\n");

        // Aktualizuj stan edytora
        this.updateEditorState(editorId, state => {
            state.lines = lineCount; // Aktualizuj liczbę linii
            state.sampleLines = sampleLines; // Aktualizuj otaczające wiersze
            state.lastModified = Date.now(); // Aktualizacja lastModified w EditorState
        });

        this.notifyPropertyChange(editorId, "content", content);
        this.notifyPropertyChange(editorId, "saved", false);

        this.editorsSaved = false; // Oznaczenie, że edytory wymagają zapisu
        this.scheduleSave();
    }

    getContents(): ContentState[] {
        return Array.from(this.contentStates.values());
    }

    isContentSaved(editorId: string): boolean {
        const contentState = this.contentStates.get(editorId);
        return contentState ? contentState.saved : false;
    }

    clear(): void {
        this.editorStates.clear();
        this.contentStates.clear();
    }

    async remove(editorId: string): Promise<void> {
        await this.mutex.runExclusive(async () => {
            const editorState = this.editorStates.get(editorId);
            if (!editorState) {
                throw new Error(`EditorState not found for editorId: ${editorId}`);
            }

            this.editorStates.delete(editorId);
            this.contentStates.delete(editorId);

            // Usuń plik tylko wtedy, gdy nie jest to ścieżka zewnętrzna
            if (!editorState.externalPath) {
                const filePath = `${this.baseDir}/${editorState.fileName}`;
                if (await window.dborg.file.exists(filePath)) {
                    await window.dborg.file.deleteFile(filePath);
                }
            }

            await this.saveStates();
        });
    }

    private scheduleSave(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout); // Wyczyść istniejący timeout
        }

        // Zaplanuj zapis po 5 sekundach od ostatniej zmiany
        this.saveTimeout = setTimeout(async () => {
            await this.performSave().catch(error => console.error(error)); // Wykonaj zapis zmienionych stanów i zawartości
        }, 5000); // 5 sekund opóźnienia

    }

    async performSave(): Promise<void> {
        await this.mutex.runExclusive(async () => {
            // Zapisz wszystkie zmienione stany edytorów
            if (!this.editorsSaved) {
                await this.saveStates();
            }

            // Zapisz tylko zmienione zawartości
            const unsavedContent = Array.from(this.contentStates.entries())
                .filter(([_, contentState]) => !contentState.saved);

            for (const [editorId, _] of unsavedContent) {
                await this.saveContent(editorId);
            }
        });
    }

    /**
     * Subskrybuje zmiany konkretnej właściwości dla konkretnego edytora.
     * @param editorId - Identyfikator edytora.
     * @param property - Nazwa właściwości (np. "fileName", "open", "content").
     * @param callback - Funkcja wywoływana przy zmianie (otrzymuje tylko nową wartość).
     * @returns Funkcja do odsubskrybowania.
     */
    onStateChange(
        editorId: string,
        property: keyof EditorState | "content" | "saved",
        callback: EditorPropertySubscriber
    ): () => void {
        if (!this.propertySubscribers.has(editorId)) {
            this.propertySubscribers.set(editorId, new Map());
        }
        const propMap = this.propertySubscribers.get(editorId)!;
        if (!propMap.has(property)) {
            propMap.set(property, new Set());
        }
        propMap.get(property)!.add(callback);

        // Zwróć funkcję do odsubskrybowania
        return () => {
            propMap.get(property)!.delete(callback);
        };
    }

    /**
     * Powiadamia subskrybentów o zmianie właściwości dla danego edytora.
     */
    private notifyPropertyChange(
        editorId: string,
        property: keyof EditorState | "content" | "saved",
        value: any
    ) {
        const propMap = this.propertySubscribers.get(editorId);
        if (propMap) {
            const subs = propMap.get(property);
            if (subs) {
                for (const cb of subs) {
                    cb(value);
                }
            }
        }
    }

    // Przykład użycia w updateEditorState:
    private updateEditorState(editorId: string, updateFn: (state: EditorState) => void, saveImmediately: boolean = false): void {
        const state = this.getState(editorId);
        if (state) {
            const before = { ...state };
            updateFn(state);
            this.editorsSaved = false;

            // Powiadom o zmianie każdej właściwości, która się zmieniła
            for (const key of Object.keys(state) as (keyof EditorState)[]) {
                if (state[key] !== before[key]) {
                    this.notifyPropertyChange(editorId, key, state[key]);
                }
            }

            if (saveImmediately) {
                this.saveStates().catch(error => console.error("Error saving states:", error));
            } else {
                this.scheduleSave();
            }
        }
    }

    async addEditor(editorId: string, type?: string, filePath?: string): Promise<void> {
        if (this.editorStates.has(editorId)) {
            throw new Error(`Editor with ID "${editorId}" already exists.`);
        }

        let externalPath: string | undefined = undefined;
        let fileName: string | undefined = undefined;
        let language: EditorLanguageId | undefined = undefined;
        if (filePath) {
            const { dir, fileName: fName, ext } = this.splitPath(filePath);
            externalPath = dir;
            fileName = fName;
            if (!type) {
                type = ext || "txt";
            }
            if (type) {
                for (const [lang, exts] of Object.entries(editorExtLanguages)) {
                    if (exts?.includes(type)) {
                        language = lang as EditorLanguageId;
                        break;
                    }
                }
            }
        }

        await this.mutex.runExclusive(async () => {
            // Tworzenie nowego stanu edytora
            const newEditorState: EditorState = {
                editorId,
                schemaId: this.schemaId,
                label: null,
                type: type ?? "txt", // Domyślny typ
                position: { top: 0, line: 0, column: 0 }, // Domyślna pozycja kursora
                lines: 0, // Domyślna liczba linii
                sampleLines: "", // Domyślny podgląd linii
                fileName: fileName ?? `${editorId}.${type ?? "txt"}`, // Domyślna nazwa pliku
                open: true, // Domyślnie edytor jest otwarty
                lastModified: Date.now(), // Aktualny czas jako czas ostatniej modyfikacji
                order: this.editorStates.size,
                externalPath,
                language,
            };

            // Tworzenie nowego stanu zawartości
            const newContentState: ContentState = {
                editorId,
                schemaId: this.schemaId,
                content: "",
                loaded: true, // Zawartość nie jest jeszcze załadowana
                saved: false, // Zawartość nie jest jeszcze zapisana
            };

            // Dodanie nowych stanów do odpowiednich map
            this.editorStates.set(editorId, newEditorState);
            this.contentStates.set(editorId, newContentState);

            if (filePath) {
                await this.loadContent(editorId);
            }

            await this.saveStates();
            await this.saveContent(editorId);
        })
    }

    reorder(): void {
        this.mutex.runExclusive(async () => {
            const sortedEditors = Array.from(this.editorStates.values())
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            sortedEditors.forEach((editor, index) => {
                this.updateEditorState(editor.editorId, state => {
                    state.order = index;
                });
            });

            await this.saveStates();
        });
    }

}

export default EditorContentManager;