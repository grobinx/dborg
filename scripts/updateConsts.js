const fs = require('fs');
const path = require('path');

// Ścieżka do pliku consts.ts
const constsPath = path.join(__dirname, '../src/api/consts.ts');

// Pobierz aktualną datę i czas
const currentDate = new Date();
const formattedDate = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
const formattedTime = currentDate.toTimeString().split(' ')[0]; // Format: HH:MM:SS
const formattedDateTime = `${formattedDate} ${formattedTime}`; // Format: YYYY-MM-DD HH:MM:SS

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

    // Zapisz zmiany w pliku
    fs.writeFileSync(constsPath, fileContent, 'utf8');
    console.log('Plik consts.ts został zaktualizowany.');
}

// Uruchom funkcję aktualizacji
updateConstsFile();