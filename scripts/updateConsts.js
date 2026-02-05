const fs = require('fs');
const { DateTime } = require('luxon');
const path = require('path');

// Ścieżki do plików
const constsPath = path.join(__dirname, '../src/api/consts.ts');
const packageJsonPath = path.join(__dirname, '../package.json');

// Pobierz aktualną datę i czas
const currentDate = DateTime.now();
const formattedDateTime = currentDate.toFormat('yyyy-MM-dd HH:mm:ss');
const currentYear = currentDate.year;

// Funkcja aktualizująca wersję i datę
function updateConstsFile() {
    // Wczytaj zawartość pliku consts.ts
    let fileContent = fs.readFileSync(constsPath, 'utf8');

    // Zwiększ numer build
    fileContent = fileContent.replace(/build:\s*(\d+)/, (match, buildNumber) => {
        const newBuildNumber = parseInt(buildNumber, 10) + 1;
        return `build: ${newBuildNumber}`;
    });

    // Zaktualizuj datę z godziną
    fileContent = fileContent.replace(/dborgDate:\s*string\s*=\s*".*?"/, `dborgDate: string = "${formattedDateTime}"`);

    // Zaktualizuj dborgDuration (format: "YYYY-YYYY" lub "YYYY")
    fileContent = fileContent.replace(/dborgDuration:\s*string\s*=\s*"(\d{4})(?:-(\d{4}))?"/g, (match, startYear, endYear) => {
        const start = parseInt(startYear, 10);
        
        if (currentYear === start) {
            // Ten sam rok - zostaw sam rok
            return `dborgDuration: string = "${currentYear}"`;
        } else if (currentYear > start) {
            // Zakres lat
            return `dborgDuration: string = "${start}-${currentYear}"`;
        } else {
            // Nie powinno się zdarzyć, ale zachowaj poprzednią wartość
            return match;
        }
    });

    // Zapisz zmiany w pliku
    fs.writeFileSync(constsPath, fileContent, 'utf8');
    console.log('Plik consts.ts został zaktualizowany.');
}

// Funkcja aktualizująca wersję w package.json
function updatePackageJsonVersion() {
    // Wczytaj zawartość pliku consts.ts
    const fileContent = fs.readFileSync(constsPath, 'utf8');

    // Pobierz wartości major, minor, release z consts.ts
    const majorMatch = fileContent.match(/major:\s*(\d+)/);
    const minorMatch = fileContent.match(/minor:\s*(\d+)/);
    const releaseMatch = fileContent.match(/release:\s*(\d+)/);

    if (!majorMatch || !minorMatch || !releaseMatch) {
        console.error('Nie znaleziono wersji (major, minor, release) w pliku consts.ts.');
        return;
    }

    const major = majorMatch[1];
    const minor = minorMatch[1];
    const release = releaseMatch[1];

    // Złóż wersję w ciąg znaków
    const version = `${major}.${minor}.${release}`;

    // Wczytaj package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Sprawdź, czy wersja się różni
    if (packageJson.version === version) {
        console.log(`Wersja w package.json (${packageJson.version}) jest już aktualna.`);
        return;
    }

    // Zaktualizuj wersję w package.json
    packageJson.version = version;

    // Zapisz zmiany w package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log('Plik package.json został zaktualizowany do wersji:', version);
}

// Uruchom funkcje aktualizacji
updateConstsFile();
updatePackageJsonVersion();