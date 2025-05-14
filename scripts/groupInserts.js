const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, '../plugins/drink-master/resources/drinks.sql');
const outputFilePath = path.join(__dirname, '../plugins/drink-master/resources/drinks_grouped.sql');

function groupInserts(sqlContent) {
    const lines = sqlContent.split('\r\n');
    const groupedInserts = {};
    const otherStatements = [];

    lines.forEach(line => {
        const match = line.match(/^INSERT INTO (\w+) \((.+?)\) VALUES \((.+?)\);$/i);
        if (match) {
            const tableName = match[1];
            const columns = match[2];
            const values = match[3];
            if (!groupedInserts[tableName]) {
                groupedInserts[tableName] = { columns, values: [] };
            }
            groupedInserts[tableName].values.push(values);
        } else {
            otherStatements.push(line);
        }
    });

    const groupedSql = Object.entries(groupedInserts).map(([table, { columns, values }]) => {
        return `INSERT INTO ${table} (${columns}) VALUES\n  ${values.map(value => `(${value})`).join(',\n  ')};`;
    });

    return [...otherStatements, ...groupedSql].join('\n');
}

function main() {
    const sqlContent = fs.readFileSync(inputFilePath, 'utf-8');
    const groupedContent = groupInserts(sqlContent);
    fs.writeFileSync(outputFilePath, groupedContent, 'utf-8');
    console.log(`Grouped SQL written to ${outputFilePath}`);
}

main();
