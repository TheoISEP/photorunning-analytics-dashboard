import { PastEventData, CurrentOrderData, AggregatedEventData, EventEvolution } from '@/types';
import { normalizeEventName } from './googleSheets';

/**
 * Agrège les données de la feuille "Current" par événement
 */
export function aggregateCurrentData(
  orders: CurrentOrderData[],
  aliasMap: Map<string, string>
): Map<string, Partial<PastEventData>> {
  const eventMap = new Map<string, {
    revenue: number;
    buyers: Set<string>;
    orders: CurrentOrderData[];
  }>();

  // Grouper par événement
  for (const order of orders) {
    const normalizedName = normalizeEventName(order.eventName, aliasMap);

    if (!eventMap.has(normalizedName)) {
      eventMap.set(normalizedName, {
        revenue: 0,
        buyers: new Set(),
        orders: [],
      });
    }

    const eventData = eventMap.get(normalizedName)!;
    eventData.revenue += order.paymentAmount - order.refund;
    eventData.buyers.add(order.email.toLowerCase());
    eventData.orders.push(order);
  }

  // Convertir en données agrégées
  const result = new Map<string, Partial<PastEventData>>();

  for (const [eventName, data] of eventMap) {
    const buyersCount = data.buyers.size;
    const ordersCount = data.orders.length;

    result.set(eventName, {
      event: eventName,
      revenue: Math.round(data.revenue * 100) / 100,
      buyers: buyersCount,
      avgOrder: buyersCount > 0 ? Math.round((data.revenue / buyersCount) * 100) / 100 : 0,
    });
  }

  return result;
}

/**
 * Fusionne les données Past et Current
 */
export function mergeEventData(
  pastData: PastEventData[],
  currentData: Map<string, Partial<PastEventData>>,
  aliasMap: Map<string, string>
): AggregatedEventData[] {
  const result: AggregatedEventData[] = [];

  // Normaliser et ajouter les données Past
  for (const event of pastData) {
    const normalizedName = normalizeEventName(event.event, aliasMap);
    const year = extractYear(event.date);
    const isTriathlon = detectTriathlon(normalizedName);

    // Fusionner avec les données Current si disponibles
    const currentEvent = currentData.get(normalizedName);

    result.push({
      ...event,
      event: normalizedName,
      revenue: currentEvent?.revenue || event.revenue,
      buyers: currentEvent?.buyers || event.buyers,
      avgOrder: currentEvent?.avgOrder || event.avgOrder,
      year,
      isTriathlon,
    });
  }

  // Ajouter les événements qui n'existent que dans Current
  for (const [eventName, eventData] of currentData) {
    if (!result.find(e => e.event === eventName)) {
      const isTriathlon = detectTriathlon(eventName);

      result.push({
        id: eventName,
        date: '',
        event: eventName,
        revenue: eventData.revenue || 0,
        participants: 0,
        buyers: eventData.buyers || 0,
        revenuePerParticipant: 0,
        buyerPercentage: 0,
        avgOrder: eventData.avgOrder || 0,
        imagesPerParticipant: 0,
        images: 0,
        year: new Date().getFullYear(),
        isTriathlon,
      });
    }
  }

  return result;
}

/**
 * Extrait l'année d'une date
 */
function extractYear(dateString: string): number {
  if (!dateString) return new Date().getFullYear();

  // Tenter différents formats de date
  const patterns = [
    /(\d{4})-\d{2}-\d{2}/, // YYYY-MM-DD
    /\d{2}\/\d{2}\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})\/\d{2}\/\d{2}/, // YYYY/MM/DD
    /(\d{4})/, // Juste l'année
  ];

  for (const pattern of patterns) {
    const match = dateString.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      if (year >= 2000 && year <= 2100) {
        return year;
      }
    }
  }

  return new Date().getFullYear();
}

/**
 * Détecte si un événement est un triathlon
 */
function detectTriathlon(eventName: string): boolean {
  const lowerName = eventName.toLowerCase();
  return lowerName.includes('triathlon') ||
         lowerName.includes('swimrun') ||
         lowerName.includes('ironman') ||
         lowerName.includes('half ironman');
}

/**
 * Calcule l'évolution par événement au fil des années
 */
export function calculateEventEvolution(events: AggregatedEventData[]): EventEvolution[] {
  const eventMap = new Map<string, EventEvolution>();

  for (const event of events) {
    if (!eventMap.has(event.event)) {
      eventMap.set(event.event, {
        eventName: event.event,
        yearlyData: [],
      });
    }

    const evolution = eventMap.get(event.event)!;
    evolution.yearlyData.push({
      year: event.year,
      revenue: event.revenue,
      buyers: event.buyers,
      participants: event.participants,
      avgOrder: event.avgOrder,
      buyerPercentage: event.buyerPercentage,
    });
  }

  // Trier les années pour chaque événement
  for (const evolution of eventMap.values()) {
    evolution.yearlyData.sort((a, b) => a.year - b.year);
  }

  return Array.from(eventMap.values());
}

/**
 * Calcule l'évolution globale par année
 */
export function calculateYearlyEvolution(events: AggregatedEventData[]): {
  year: number;
  revenue: number;
  buyers: number;
  events: number;
  avgOrder: number;
}[] {
  const yearMap = new Map<number, {
    revenue: number;
    buyers: number;
    events: number;
    totalOrders: number;
  }>();

  for (const event of events) {
    if (!yearMap.has(event.year)) {
      yearMap.set(event.year, {
        revenue: 0,
        buyers: 0,
        events: 0,
        totalOrders: 0,
      });
    }

    const yearData = yearMap.get(event.year)!;
    yearData.revenue += event.revenue;
    yearData.buyers += event.buyers;
    yearData.events += 1;
    yearData.totalOrders += event.revenue;
  }

  const result = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    revenue: Math.round(data.revenue * 100) / 100,
    buyers: data.buyers,
    events: data.events,
    avgOrder: data.buyers > 0 ? Math.round((data.revenue / data.buyers) * 100) / 100 : 0,
  }));

  return result.sort((a, b) => a.year - b.year);
}

/**
 * Filtre les événements triathlons
 */
export function filterTriathlons(events: AggregatedEventData[]): AggregatedEventData[] {
  return events.filter(event => event.isTriathlon);
}
