import { RichNode } from "./types";

type RichExampleMap = Record<string, RichNode[]>;

const placeholderSvg = (label: string, bg = "dfe7f5", fg = "2c3e50") =>
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='120'%3E%3Crect fill='%23${bg}' width='420' height='120'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23${fg}' font-family='monospace' font-size='18'%3E${encodeURIComponent(label)}%3C/text%3E%3C/svg%3E`;

export const richContentExamples: RichExampleMap = {
    allTextVariants: [
        { type: "text", text: "Body / normal", variant: "body", severity: "default" },
        { type: "text", text: "Caption / info", variant: "caption", severity: "info" },
        { type: "text", text: "Label / warning", variant: "label", severity: "warning" },
        { type: "text", text: "Title / success", variant: "title", severity: "success" },
        { type: "text", text: "Description / default", variant: "description", severity: "default" },
        {
            type: "text",
            variant: "markdown",
            severity: "default",
            text: `
## Markdown demo
- **bold**
- _italic_
- \`inline code\`

\`\`\`sql
SELECT id, name
FROM users
WHERE active = true;
\`\`\`
            `.trim(),
        },
    ],

    linksChipsBadges: [
        { type: "link", text: "Strona projektu", href: "https://github.com", severity: "info", variant: "body" },
        { type: "link", href: "https://example.org/only-href", severity: "warning", variant: "caption" },
        { type: "chip", text: "Draft", severity: "default" },
        { type: "chip", text: "Info", severity: "info", badge: { value: 2, severity: "info" } },
        { type: "chip", text: "Warn", severity: "warning", variant: "outlined", badge: { value: 12, max: 9, severity: "warning" } },
        { type: "chip", text: "Error", severity: "error", badge: { value: "!", severity: "error" } },
        { type: "chip", text: "Success", severity: "success", badge: { value: "OK", severity: "success" } },
    ],

    iconsKbdSpacerDivider: [
        { type: "icon", icon: "ℹ", severity: "info", tooltip: "Informacja" },
        { type: "icon", icon: "⚠", severity: "warning", tooltip: "Ostrzeżenie" },
        { type: "row", items: [{ type: "icon", icon: "⛔", severity: "error", tooltip: "Błąd" }, { type: "text", text: "Opis ikony" }]},
        { type: "divider" },
        { type: "row", gap: 8, items: [{ type: "text", text: "Ctrl+S:" }, { type: "kbd", keys: ["Ctrl", "S"] }] },
        { type: "row", gap: 8, items: [{ type: "text", text: "Command palette:" }, { type: "kbd", keys: "Ctrl+Shift+P" }] },
        { type: "divider" },
        { type: "row", items: [{ type: "text", text: "Lewa" }, { type: "spacer", size: "auto" }, { type: "text", text: "Prawa" }] },
        { type: "spacer", size: 16 },
        { type: "text", text: "Po spacerze 16px", variant: "caption" },
    ],

    codeAndProgress: [
        {
            type: "code",
            language: "sql",
            lineNumbers: true,
            code: [
                "EXPLAIN ANALYZE",
                "SELECT u.id, u.email",
                "FROM users u",
                "WHERE u.active = true",
                "ORDER BY u.created_at DESC",
                "LIMIT 25;",
            ].join("\n"),
        },
        {
            type: "code",
            language: "json",
            lineNumbers: false,
            code: JSON.stringify(
                {
                    severity: "warning",
                    message: "Potential full table scan",
                    recommendation: "add index on users(active, created_at)",
                },
                null,
                2
            ),
        },
        { type: "progress", label: "Indeksowanie", value: 18, showPercent: true, severity: "info" },
        { type: "progress", label: "Przetwarzanie", value: 54, bufferValue: 72, showPercent: true, severity: "warning" },
        { type: "progress", label: "Zakończono", value: 100, showPercent: true, severity: "success" },
        { type: "progress", label: "Rollback", value: 80, showPercent: true, severity: "error" },
    ],

    imagesFitModes: [
        { type: "text", text: "fit: contain", variant: "label" },
        { type: "image", src: placeholderSvg("contain"), width: 320, height: 100, fit: "contain", alt: "contain" },
        { type: "text", text: "fit: cover", variant: "label" },
        { type: "image", src: placeholderSvg("cover", "fbe4d8", "6e2c00"), width: 320, height: 100, fit: "cover", alt: "cover" },
        { type: "text", text: "fit: fill", variant: "label" },
        { type: "image", src: placeholderSvg("fill", "d5f5e3", "145a32"), width: 320, height: 100, fit: "fill", alt: "fill" },
        { type: "text", text: "fit: none", variant: "label" },
        { type: "image", src: placeholderSvg("none", "fdebd0", "7e5109"), width: 320, height: 100, fit: "none", alt: "none" },
        { type: "text", text: "fit: scale-down", variant: "label" },
        { type: "image", src: placeholderSvg("scale-down", "ebdef0", "4a235a"), width: 320, height: 100, fit: "scale-down", alt: "scale-down" },
    ],

    alerts: [
        {
            type: "alert",
            severity: "info",
            title: "Info alert",
            showIcon: true,
            items: [
                { type: "text", text: "To jest komunikat informacyjny." },
                { type: "link", href: "https://example.com/info", text: "Czytaj więcej" },
            ],
        },
        {
            type: "alert",
            severity: "warning",
            title: "Warning alert",
            showIcon: true,
            items: [
                { type: "text", text: "Wykryto kosztowną operację." },
                { type: "chip", text: "Seq Scan", severity: "warning" },
                { type: "code", language: "sql", code: "SELECT * FROM orders WHERE status = 'OPEN';" },
            ],
        },
        {
            type: "alert",
            severity: "error",
            title: "Error alert",
            showIcon: true,
            items: [
                { type: "text", text: "Nie udało się wykonać zapytania.", severity: "error" },
                { type: "kbd", keys: ["Ctrl", "Enter"] },
            ],
        },
    ],

    listModes: [
        {
            type: "list",
            listType: "bullet",
            items: [
                { type: "listitem", items: [{ type: "text", text: "Bullet item 1" }] },
                { type: "listitem", severity: "info", items: [{ type: "text", text: "Bullet info item" }, { type: "chip", text: "INFO", severity: "info" }] },
            ],
        },
        {
            type: "list",
            listType: "numbered",
            items: [
                { type: "listitem", items: [{ type: "text", text: "Numbered item 1" }] },
                { type: "listitem", severity: "warning", items: [{ type: "text", text: "Numbered warning item" }] },
                { type: "listitem", severity: "error", items: [{ type: "text", text: "Numbered error item" }] },
            ],
        },
        {
            type: "list",
            listType: "none",
            items: [
                { type: "listitem", severity: "warning", indicator: true, items: [{ type: "text", text: "List without markers #1" }] },
                { type: "listitem", severity: "error", indicator: true, items: [{ type: "text", text: "List without markers #2" }] },
            ],
        },
    ],

    layoutRowsColumns: [
        {
            type: "row",
            layout: "grid",
            align: "start",
            justify: "space-between",
            items: [
                {
                    type: "column",
                    size: 3,
                    gap: 6,
                    items: [{ type: "text", text: "col-3", variant: "label" }, { type: "chip", text: "A", severity: "info" }],
                },
                {
                    type: "column",
                    size: 6,
                    gap: 6,
                    items: [
                        { type: "text", text: "col-6", variant: "label" },
                        { type: "text", text: "Tutaj dłuższa zawartość, żeby sprawdzić wrapping i zachowanie szerokości." },
                    ],
                },
                {
                    type: "column",
                    size: 3,
                    gap: 6,
                    items: [{ type: "text", text: "col-3", variant: "label" }, { type: "icon", icon: "⚙", severity: "success" }],
                },
            ],
        },
        {
            type: "row",
            align: "center",
            justify: "space-between",
            items: [{ type: "text", text: "Lewa strona" }, { type: "spacer", size: "auto" }, { type: "text", text: "Prawa strona", severity: "success" }],
        },
        {
            type: "column",
            size: "auto",
            items: [{ type: "text", text: "Kolumna auto #1" }, { type: "text", text: "Kolumna auto #2", severity: "info" }, { type: "divider" }],
        },
    ],

    actions: [
        {
            type: "action",
            id: "act-sync",
            label: "Synchronizuj",
            tooltip: "Uruchom synchronizację",
            icon: "Refresh",
            run: async () => {
                await new Promise((r) => setTimeout(r, 350));
                console.log("sync complete");
            },
            badge: { value: 4, severity: "warning", max: 99 },
            severity: "warning",
        },
        {
            type: "action",
            id: "act-disabled",
            label: `Niedostępna`,
            tooltip: `Ta akcja jest zablokowana`,
            icon: "Error",
            disabled: true,
            run: () => {
                console.log("This should not run while disabled");
            },
            keySequence: ["Ctrl+Alt+D"],
        },
        {
            type: "action",
            id: "act-selected",
            label: `Tryb aktywny`,
            description: `Wybrana akcja`,
            selected: () => true,
            loading: () => false,
            icon: "CheckBoxChecked",
            run: () => {
                console.log("selected action");
            },
        },
    ],

    megaScenario: [
        {
            type: "group",
            title: "Query Analyzer: Full Demo",
            icon: "🧠",
            severity: "info",
            collapsible: true,
            defaultExpanded: true,
            items: [
                {
                    type: "row",
                    layout: "grid",
                    justify: "space-between",
                    items: [
                        {
                            type: "column",
                            size: 4,
                            items: [
                                { type: "text", text: "Status", variant: "label" },
                                { type: "chip", text: "WARNING", severity: "warning", badge: { value: "!" } },
                            ],
                        },
                        {
                            type: "column",
                            size: 4,
                            items: [
                                { type: "text", text: "Exec Time", variant: "label" },
                                { type: "text", text: "742 ms", severity: "warning" },
                            ],
                        },
                        {
                            type: "column",
                            size: 4,
                            items: [
                                { type: "text", text: "Rows", variant: "label" },
                                { type: "text", text: "1 532", severity: "info" },
                            ],
                        },
                    ],
                },
                { type: "divider" },
                {
                    type: "alert",
                    severity: "warning",
                    title: "Potential Optimization",
                    showIcon: true,
                    items: [
                        { type: "text", text: "Rozważ indeks na `users(active, created_at)`.", variant: "markdown" },
                        {
                            type: "list",
                            listType: "numbered",
                            items: [
                                { type: "listitem", items: [{ type: "text", text: "Dodaj indeks" }] },
                                { type: "listitem", items: [{ type: "text", text: "Uruchom ANALYZE" }] },
                                { type: "listitem", items: [{ type: "text", text: "Porównaj plan" }] },
                            ],
                        },
                    ],
                },
                {
                    type: "code",
                    language: "sql",
                    lineNumbers: true,
                    code: [
                        "Seq Scan on users",
                        "  Filter: (active = true)",
                        "  Rows Removed by Filter: 152341",
                        "  Execution Time: 742.31 ms",
                    ].join("\n"),
                },
                {
                    type: "progress",
                    label: "Applying recommendation",
                    value: 35,
                    bufferValue: 62,
                    showPercent: true,
                    severity: "info",
                },
                {
                    type: "row",
                    gap: 8,
                    items: [
                        {
                            type: "action",
                            id: "apply-index",
                            label: "Apply Index",
                            tooltip: "Wygeneruj DDL indeksu",
                            icon: "⚙",
                            run: () => console.log("apply index"),
                            badge: { value: "new", severity: "success" },
                        },
                        {
                            type: "action",
                            id: "open-docs",
                            label: "Open Docs",
                            icon: "📘",
                            run: () => { window.open("https://www.postgresql.org/docs/", "_blank"); },
                        },
                    ],
                },
                { type: "image", src: placeholderSvg("Execution Plan Snapshot", "eaf2ff", "1b263b"), width: "100%", height: 140, fit: "cover" },
            ],
        },
    ],
};

export const allExamples: RichNode[] = Object.values(richContentExamples).flat();