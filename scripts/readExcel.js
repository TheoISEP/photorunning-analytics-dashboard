const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Lire le fichier Excel
const workbook = XLSX.readFile(path.join(__dirname, '../Analytics new site.xlsx'));

console.log('Feuilles disponibles:', workbook.SheetNames);

// Lire la feuille "data"
const sheetName = 'data';
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  console.error('Feuille "data" non trouvée');
  process.exit(1);
}

// Convertir en JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\n=== APERÇU DES DONNÉES ===');
console.log('Nombre de lignes:', data.length);
console.log('\n--- Premières lignes ---');
data.slice(0, 20).forEach((row, i) => {
  console.log(`Ligne ${i}:`, row);
});

// Sauvegarder en JSON
fs.writeFileSync(
  path.join(__dirname, 'excel-data.json'),
  JSON.stringify(data, null, 2)
);

console.log('\n✓ Données exportées dans scripts/excel-data.json');
