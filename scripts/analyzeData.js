const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Lire le fichier Excel
const workbook = XLSX.readFile(path.join(__dirname, '../Analytics new site.xlsx'));
const worksheet = workbook.Sheets['data'];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('📊 ANALYSE DES DONNÉES PHOTORUNNING\n');
console.log(`Total de commandes : ${data.length.toLocaleString('fr-FR')}`);

// Analyser les données
let totalCA = 0;
let totalBuyers = new Set();
let totalRemboursements = 0;
const eventMap = new Map();
const yearMap = new Map();

data.forEach((row) => {
  const montant = parseFloat(row['Montant de paiement']) || 0;
  const remboursement = parseFloat(row['Remboursement']) || 0;
  const email = row['Email'];
  const eventName = row["Nom de l'event"];
  const dateExcel = row['Date'];

  // Calculer le CA net
  const caNet = montant - remboursement;
  totalCA += caNet;
  totalRemboursements += remboursement;

  // Compter les acheteurs uniques
  if (email) {
    totalBuyers.add(email.toLowerCase());
  }

  // Grouper par événement
  if (!eventMap.has(eventName)) {
    eventMap.set(eventName, {
      ca: 0,
      buyers: new Set(),
      orders: 0
    });
  }
  const eventData = eventMap.get(eventName);
  eventData.ca += caNet;
  eventData.orders++;
  if (email) {
    eventData.buyers.add(email.toLowerCase());
  }

  // Convertir la date Excel en année
  if (dateExcel && !isNaN(dateExcel)) {
    // Date Excel : nombre de jours depuis le 1er janvier 1900
    const date = new Date((dateExcel - 25569) * 86400 * 1000);
    const year = date.getFullYear();

    if (year >= 2000 && year <= 2100) {
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          ca: 0,
          buyers: new Set(),
          orders: 0,
          events: new Set()
        });
      }
      const yearData = yearMap.get(year);
      yearData.ca += caNet;
      yearData.orders++;
      if (email) yearData.buyers.add(email.toLowerCase());
      if (eventName) yearData.events.add(eventName);
    }
  }
});

// Afficher les résultats
console.log('\n💰 CHIFFRE D\'AFFAIRES');
console.log(`CA Total : ${totalCA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
console.log(`Remboursements : ${totalRemboursements.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);

console.log(`\n👥 ACHETEURS`);
console.log(`Acheteurs uniques : ${totalBuyers.size.toLocaleString('fr-FR')}`);
console.log(`Panier moyen : ${(totalCA / totalBuyers.size).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);

console.log(`\n📅 ÉVÉNEMENTS`);
console.log(`Nombre d'événements : ${eventMap.size.toLocaleString('fr-FR')}`);

// Top 10 événements par CA
const topEvents = Array.from(eventMap.entries())
  .map(([name, data]) => ({
    name,
    ca: data.ca,
    buyers: data.buyers.size,
    orders: data.orders
  }))
  .sort((a, b) => b.ca - a.ca)
  .slice(0, 10);

console.log('\nTop 10 événements par CA :');
topEvents.forEach((event, i) => {
  console.log(`${i + 1}. ${event.name}`);
  console.log(`   CA : ${event.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
  console.log(`   Acheteurs : ${event.buyers.toLocaleString('fr-FR')}`);
});

// CA par année
console.log('\n📆 ÉVOLUTION ANNUELLE');
const yearlyData = Array.from(yearMap.entries())
  .sort((a, b) => a[0] - b[0]);

yearlyData.forEach(([year, data]) => {
  console.log(`\n${year} :`);
  console.log(`  CA : ${data.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
  console.log(`  Acheteurs : ${data.buyers.size.toLocaleString('fr-FR')}`);
  console.log(`  Commandes : ${data.orders.toLocaleString('fr-FR')}`);
  console.log(`  Événements : ${data.events.size}`);
});

// Sauvegarder les statistiques
const stats = {
  totalCA,
  totalBuyers: totalBuyers.size,
  panierMoyen: totalCA / totalBuyers.size,
  totalRemboursements,
  nombreEvenements: eventMap.size,
  topEvents,
  parAnnee: yearlyData.map(([year, data]) => ({
    year,
    ca: data.ca,
    buyers: data.buyers.size,
    orders: data.orders,
    events: data.events.size,
    panierMoyen: data.ca / data.buyers.size
  }))
};

fs.writeFileSync(
  path.join(__dirname, 'stats.json'),
  JSON.stringify(stats, null, 2)
);

console.log('\n✅ Statistiques sauvegardées dans scripts/stats.json');
