import { PastEventData, CurrentOrderData, NowEventData, AliasData, RecordData } from '@/types';

const SPREADSHEET_ID = '1GOQpTXj6HG-_hoQb-TXG5rF6sZTHm8KLF5j1t2vGq7k';

// GID pour chaque feuille
// Pour trouver le GID d'une feuille : ouvrir la feuille et regarder l'URL
// Example: ...edit#gid=790186548
const SHEETS = {
  PAST: '0',              // Feuille "Past"
  CURRENT: '790186548',   // Feuille "Current"
  NOW: '722007554',       // Feuille "Now"
  ALIASE: '847386932',    // Feuille "Aliase"
  RECORD: '1427424627',   // Feuille "Record"
};

/**
 * Récupère les données d'une feuille Google Sheets publique
 */
async function fetchSheetData(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store', // Toujours récupérer les données fraîches
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

/**
 * Parse un CSV en tableau 2D en gérant correctement les guillemets
 */
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    if (line.trim()) {
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          // Toggle l'état des guillemets
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          // Virgule en dehors des guillemets = séparateur
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          // Ajouter le caractère à la valeur courante
          currentValue += char;
        }
      }

      // Ajouter la dernière valeur
      values.push(currentValue.trim());
      result.push(values);
    }
  }

  return result;
}

/**
 * Convertit une valeur en nombre, retourne 0 si invalide
 * Gère les virgules décimales françaises (27,99 → 27.99)
 */
function toNumber(value: string | undefined): number {
  if (!value) return 0;
  // Remplacer la virgule décimale par un point
  const withDot = value.replace(',', '.');
  // Enlever tous les caractères non numériques sauf le point et le tiret
  const cleaned = withDot.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Récupère les données de la feuille "Past"
 */
export async function fetchPastData(): Promise<PastEventData[]> {
  const data = await fetchSheetData(SHEETS.PAST);

  // Ignorer la première ligne (en-têtes)
  // IMPORTANT: Les valeurs avec virgule décimale sont en milliers, les entiers sont en euros
  return data.slice(1).map((row, index) => {
    // Fonction pour déterminer si une valeur doit être multipliée
    const shouldMultiply = (value: string) => {
      if (!value) return false;
      const trimmed = value.trim();

      // Vérifier si la chaîne contient un point ou virgule suivi de chiffres significatifs (non-zéros)
      const hasSignificantDecimals = /[.,]\d*[1-9]/.test(trimmed);

      const num = parseFloat(trimmed.replace(',', '.'));

      // Si < 1 (ex: 0.986), toujours multiplier par 1000
      if (num < 1 && num > 0) return true;

      // Si >= 1, multiplier seulement si a des décimales significatives (ex: 96.17 oui, 986.00 non)
      return hasSignificantDecimals;
    };

    const rawRevenue = toNumber(row[3]);
    const rawRevenuePerParticipant = toNumber(row[6]);
    const rawAvgOrder = toNumber(row[8]);

    return {
      id: row[0] || String(index + 1),
      date: row[1] || '',
      event: row[2] || '',
      revenue: shouldMultiply(row[3]) ? rawRevenue * 1000 : rawRevenue,
      participants: toNumber(row[4]),
      buyers: toNumber(row[5]),
      revenuePerParticipant: shouldMultiply(row[6]) ? rawRevenuePerParticipant * 1000 : rawRevenuePerParticipant,
      buyerPercentage: toNumber(row[7]),
      avgOrder: shouldMultiply(row[8]) ? rawAvgOrder * 1000 : rawAvgOrder,
      imagesPerParticipant: toNumber(row[9]),
      images: toNumber(row[10]),
    };
  }).filter(event => event.event); // Filtrer les lignes vides
}

/**
 * Récupère les données de la feuille "Current"
 */
export async function fetchCurrentData(): Promise<CurrentOrderData[]> {
  const data = await fetchSheetData(SHEETS.CURRENT);

  // Ignorer la première ligne (en-têtes)
  return data.slice(1).map(row => ({
    articleNumber: row[0] || '',
    date: row[1] || '',
    time: row[2] || '',
    email: row[3] || '',
    eventName: row[4] || '',
    articleName: row[5] || '',
    quantity: toNumber(row[6]),
    paymentAmount: toNumber(row[7]),
    paymentCurrency: row[8] || 'EUR',
    transferAmount: toNumber(row[9]),
    transferCurrency: row[10] || 'EUR',
    refund: toNumber(row[11]),
    bib: row[12] || '',
    taxRate: toNumber(row[13]),
  })).filter(order => order.eventName); // Filtrer les lignes vides
}

/**
 * Récupère les données de la feuille "Now"
 * Colonnes: Événement, Date, CA total, Rev./coureur, % acheteurs, Coureurs, Commandes, Panier moy., Photos
 */
export async function fetchNowData(): Promise<NowEventData[]> {
  const data = await fetchSheetData(SHEETS.NOW);

  // Ignorer la première ligne (en-têtes)
  return data.slice(1).map(row => ({
    event: row[0] || '',
    date: row[1] || '',
    totalRevenue: toNumber(row[2]),
    revenuePerParticipant: toNumber(row[3]),
    buyerPercentage: toNumber(row[4]),
    participants: toNumber(row[5]),
    orders: toNumber(row[6]),
    avgOrder: toNumber(row[7]),
    photos: toNumber(row[8]),
  })).filter(event => event.event); // Filtrer les lignes vides
}

/**
 * Récupère les données de la feuille "Aliase"
 */
export async function fetchAliaseData(): Promise<Map<string, string>> {
  try {
    const data = await fetchSheetData(SHEETS.ALIASE);

    const aliasMap = new Map<string, string>();

    // Créer un mapping des variants vers les noms canoniques
    for (const row of data) {
      if (row[0] && row[1]) {
        aliasMap.set(row[0].trim(), row[1].trim());
      }
    }

    return aliasMap;
  } catch (error) {
    console.error('Error fetching alias data:', error);
    // Retourner un Map vide si erreur
    return new Map();
  }
}

/**
 * Normalise un nom d'événement en utilisant les alias
 * Retire l'année avant de chercher dans les alias, puis la réajoute au nom normalisé
 */
export function normalizeEventName(eventName: string, aliasMap: Map<string, string>): string {
  const trimmed = eventName.trim();

  // Extraire l'année si elle existe
  const yearMatch = trimmed.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : '';

  // Retirer l'année pour la recherche dans les alias
  const nameWithoutYear = trimmed.replace(/\s*20\d{2}\s*$/, '').trim();

  // Chercher dans les alias
  const normalized = aliasMap.get(nameWithoutYear) || nameWithoutYear;

  // Ré-ajouter l'année si elle existait
  return year ? `${normalized} ${year}` : normalized;
}

/**
 * Récupère les données de la feuille "Record"
 * Format: type | value | detail
 * Exemple: Journée record | 78 828 € | 12/05/2026
 */
export async function fetchRecordsData(): Promise<RecordData[]> {
  try {
    const data = await fetchSheetData(SHEETS.RECORD);

    // Ignorer la première ligne (en-têtes)
    return data.slice(1).map((row) => ({
      type: row[0] || '',
      value: row[1] || '',
      detail: row[2] || ''
    })).filter(record => record.type && record.value); // Filtrer les lignes vides
  } catch (error) {
    console.error('Error fetching records data:', error);
    // Retourner un tableau vide si erreur
    return [];
  }
}
