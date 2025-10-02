// Uruchom: node scripts/check-i18n-usage.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT);
const TRANSLATION = path.join(ROOT, 'src', 'renderer', 'locales', 'pl', 'translation.json');

function walk(dir, out = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (e.name === 'node_modules' || e.name === 'out' || e.name === 'doc' || e.name === 'dist' || e.name === 'build' || e.name.startsWith('.')) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.(ts?|tsx?|jsx?|html)$/.test(e.name)) out.push(p);
    }
    return out;
}

function flatten(obj, prefix = '', out = new Set()) {
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
        else out.add(key);
    }
    return out;
}

function collectUsedKeys(files) {
    const used = new Set();
    const reT = /(?:\bi18n\.t|\bt)\(\s*['"`]([^'"`]+)['"`]\s*[,)]/g;
    const reTrans = /i18nKey\s*=\s*{?\s*['"`]([^'"`]+)['"`]\s*}?/g;

    for (const file of files) {
        const txt = fs.readFileSync(file, 'utf8');
        let m;
        while ((m = reT.exec(txt))) used.add(m[1]);
        while ((m = reTrans.exec(txt))) used.add(m[1]);
    }
    return used;
}

(function main() {
    const files = walk(SRC);
    const dict = JSON.parse(fs.readFileSync(TRANSLATION, 'utf8'));
    const defined = flatten(dict);
    const used = collectUsedKeys(files);

    const unused = [...defined].filter(k => !used.has(k)).sort();
    const missing = [...used].filter(k => !defined.has(k)).sort();

    console.log(`Files scanned: ${files.length}`);
    console.log(`Defined keys: ${defined.size}, Used keys: ${used.size}`);
    console.log(`Unused in translation.json: ${unused.length}`);
    if (unused.length) console.log(unused.join('\n'));
    console.log(`\nMissing in translation.json (used but not defined): ${missing.length}`);
    if (missing.length) console.log(missing.join('\n'));
})();