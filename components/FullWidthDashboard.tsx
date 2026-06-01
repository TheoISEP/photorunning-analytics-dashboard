'use client';

import { useState, useEffect, Fragment } from 'react';
import { clearAuthSession } from '@/lib/auth';
import { fetchPastData, fetchNowData, fetchAliaseData, normalizeEventName, fetchRecordsData } from '@/lib/googleSheets';
import { RecordData } from '@/types';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Euro,
  Calendar,
  LogOut,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trophy,
  Award,
  Star,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import EventDetailView from './EventDetailView';
import YearlyComparison from './YearlyComparison';

interface EventStats {
  name: string;
  ca: number;
  buyers: number;
  orders: number;
  avgOrder: number;
  participants: number;
  revenuePerParticipant: number;
  buyerPercentage: number;
}

export default function FullWidthDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCA: 0,
    currentYearCA: 0,
    totalBuyers: 0,
    currentYearBuyers: 0,
    totalOrders: 0,
    currentYearOrders: 0,
    nombreEvenements: 0,
    currentYearEvents: 0,
    panierMoyen: 0,
    currentYearPanierMoyen: 0,
    topEvents: [] as EventStats[],
    allEvents: [] as EventStats[]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showTriathlonsOnly, setShowTriathlonsOnly] = useState(false);
  const [groupByYear, setGroupByYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [yearlyStats, setYearlyStats] = useState<{
    allCourses: any[];
    triathlons: any[];
  }>({ allCourses: [], triathlons: [] });
  const [cumulativeData, setCumulativeData] = useState<Array<{ date: string; cumulative: number; yearly: number }>>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<'ca' | 'buyers' | 'avgOrder' | 'participants' | 'revenuePerParticipant' | 'buyerPercentage' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [records, setRecords] = useState<RecordData[]>([]);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();

    // Détecter si on est sur mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [pastData, nowData, aliasMap, recordsData] = await Promise.all([
        fetchPastData(),
        fetchNowData(),
        fetchAliaseData(),
        fetchRecordsData(),
      ]);

      // Stocker les records
      setRecords(recordsData);

      const eventMap = new Map<string, {
        ca: number;
        buyers: Set<string>;
        orders: number;
        participants: number;
      }>();

      // Ajouter les données historiques (Past)
      // IMPORTANT: Les données "Past" sont en milliers, donc on divise par 1000
      pastData.forEach((event) => {
        const normalizedName = normalizeEventName(event.event, aliasMap);

        if (!eventMap.has(normalizedName)) {
          eventMap.set(normalizedName, {
            ca: 0,
            buyers: new Set(),
            orders: 0,
            participants: 0
          });
        }

        const eventData = eventMap.get(normalizedName)!;
        eventData.ca += event.revenue; // Déjà converti dans googleSheets.ts
        eventData.participants += event.participants;
        // Pour Past, on n'a pas les emails individuels, on crée des buyers fictifs uniques
        const currentBuyerCount = eventData.buyers.size;
        for (let i = 0; i < event.buyers; i++) {
          eventData.buyers.add(`${normalizedName}_past_buyer_${currentBuyerCount + i}`);
        }
        eventData.orders += event.buyers; // Approximation: 1 buyer = 1 order
      });

      // Ajouter les données actuelles (Now)
      nowData.forEach((event) => {
        const normalizedName = normalizeEventName(event.event, aliasMap);

        if (!eventMap.has(normalizedName)) {
          eventMap.set(normalizedName, {
            ca: 0,
            buyers: new Set(),
            orders: 0,
            participants: 0
          });
        }

        const eventData = eventMap.get(normalizedName)!;
        eventData.ca += event.totalRevenue;
        eventData.orders += event.orders;
        eventData.participants += event.participants;
        // Pour Now, on n'a pas les emails individuels, on crée des buyers fictifs uniques basés sur le nombre de commandes
        const currentBuyerCount = eventData.buyers.size;
        for (let i = 0; i < event.orders; i++) {
          eventData.buyers.add(`${normalizedName}_now_buyer_${currentBuyerCount + i}`);
        }
      });

      let totalCA = 0;
      const allBuyers = new Set<string>();
      let totalOrders = 0;

      const topEvents: EventStats[] = [];

      eventMap.forEach((data, name) => {
        totalCA += data.ca;
        totalOrders += data.orders;
        data.buyers.forEach(buyer => allBuyers.add(buyer));

        topEvents.push({
          name,
          ca: Math.round(data.ca * 100) / 100,
          buyers: data.buyers.size,
          orders: data.orders,
          avgOrder: data.buyers.size > 0 ? Math.round((data.ca / data.buyers.size) * 100) / 100 : 0,
          participants: data.participants,
          revenuePerParticipant: data.participants > 0 ? Math.round((data.ca / data.participants) * 100) / 100 : 0,
          buyerPercentage: data.participants > 0 ? Math.round((data.buyers.size / data.participants) * 10000) / 100 : 0
        });
      });

      topEvents.sort((a, b) => b.ca - a.ca);

      // Calculer les données cumulatives par année à partir des événements déjà agrégés
      interface YearlyCA {
        [year: string]: number;
      }

      const yearlyCA: YearlyCA = {};

      // Parcourir les événements agrégés pour extraire l'année et le CA
      // Cela évite de compter deux fois les données Past et Current
      eventMap.forEach((data, eventName) => {
        // Essayer d'extraire l'année du nom de l'événement
        const yearMatch = eventName.match(/20\d{2}/);
        if (yearMatch) {
          const year = yearMatch[0];
          if (!yearlyCA[year]) {
            yearlyCA[year] = 0;
          }
          yearlyCA[year] += data.ca;
        } else {
          // Si pas d'année dans le nom, essayer avec les données Past
          const pastEvent = pastData.find(e => normalizeEventName(e.event, aliasMap) === eventName);
          if (pastEvent) {
            const dateParts = pastEvent.date.split('/');
            let year = dateParts[2] || '';

            if (year.length === 2) {
              const yearNum = parseInt(year);
              year = yearNum >= 0 && yearNum <= 30 ? `20${year}` : `19${year}`;
            }

            if (!yearlyCA[year]) {
              yearlyCA[year] = 0;
            }
            yearlyCA[year] += data.ca;
          } else {
            // Sinon essayer avec Now
            const nowEvent = nowData.find(e => normalizeEventName(e.event, aliasMap) === eventName);
            if (nowEvent) {
              const dateParts = nowEvent.date.split('/');
              let year = dateParts[2] || '';

              if (year.length === 2) {
                const yearNum = parseInt(year);
                year = yearNum >= 0 && yearNum <= 30 ? `20${year}` : `19${year}`;
              }

              if (!yearlyCA[year]) {
                yearlyCA[year] = 0;
              }
              yearlyCA[year] += data.ca;
            }
          }
        }
      });

      // Créer une liste d'années de 2019 à 2026
      const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
      const cumulativeTimeline: { date: string; cumulative: number; yearly: number }[] = [];
      let cumulative = 0;

      years.forEach((year) => {
        const yearlyAmount = yearlyCA[year] || 0;
        cumulative += yearlyAmount;
        cumulativeTimeline.push({
          date: year,
          cumulative: Math.round(cumulative * 100) / 100,
          yearly: Math.round(yearlyAmount * 100) / 100
        });
      });

      setCumulativeData(cumulativeTimeline);

      // Calculer les stats de l'année en cours
      const currentYear = new Date().getFullYear().toString();
      const currentYearCA = yearlyCA[currentYear] || 0;

      // Filtrer les événements de l'année en cours
      const currentYearBuyersSet = new Set<string>();
      let currentYearOrders = 0;
      let currentYearEventsCount = 0;

      eventMap.forEach((data, eventName) => {
        // Extraire l'année du nom de l'événement
        const yearMatch = eventName.match(/20\d{2}/);
        let year = yearMatch ? yearMatch[0] : null;

        // Si pas d'année dans le nom, essayer depuis les données
        if (!year) {
          const pastEvent = pastData.find(e => normalizeEventName(e.event, aliasMap) === eventName);
          if (pastEvent) {
            const dateParts = pastEvent.date.split('/');
            let yearStr = dateParts[2] || '';
            if (yearStr.length === 2) {
              const yearNum = parseInt(yearStr);
              yearStr = yearNum >= 0 && yearNum <= 30 ? `20${yearStr}` : `19${yearStr}`;
            }
            year = yearStr;
          } else {
            const nowEvent = nowData.find(e => normalizeEventName(e.event, aliasMap) === eventName);
            if (nowEvent) {
              const dateParts = nowEvent.date.split('/');
              let yearStr = dateParts[2] || '';
              if (yearStr.length === 2) {
                const yearNum = parseInt(yearStr);
                yearStr = yearNum >= 0 && yearNum <= 30 ? `20${yearStr}` : `19${yearStr}`;
              }
              year = yearStr;
            }
          }
        }

        // Si c'est l'année en cours, ajouter aux stats
        if (year === currentYear) {
          currentYearEventsCount++;
          currentYearOrders += data.orders;
          data.buyers.forEach(buyer => currentYearBuyersSet.add(buyer));
        }
      });

      const currentYearBuyers = currentYearBuyersSet.size;
      const currentYearPanierMoyen = currentYearBuyers > 0 ? Math.round((currentYearCA / currentYearBuyers) * 100) / 100 : 0;

      setStats({
        totalCA: Math.round(totalCA * 100) / 100,
        currentYearCA: Math.round(currentYearCA * 100) / 100,
        totalBuyers: allBuyers.size,
        currentYearBuyers,
        totalOrders,
        currentYearOrders,
        nombreEvenements: eventMap.size,
        currentYearEvents: currentYearEventsCount,
        panierMoyen: allBuyers.size > 0 ? Math.round((totalCA / allBuyers.size) * 100) / 100 : 0,
        currentYearPanierMoyen,
        topEvents: topEvents.slice(0, 15),
        allEvents: topEvents
      });

      // Agréger les données historiques par année
      const yearlyMap = new Map<string, {
        participants: number;
        revenue: number;
        buyers: number;
      }>();

      const yearlyTriathlonMap = new Map<string, {
        participants: number;
        revenue: number;
        buyers: number;
      }>();

      // Mots-clés pour identifier les triathlons
      const triathlonKeywords = ['triathlon', 'swimrun', 't24', 'ventouxman', 'bayman'];

      pastData.forEach(event => {
        // Extraire l'année de la date (format: DD/MM/YYYY)
        const dateParts = event.date.split('/');
        let year = dateParts[dateParts.length - 1] || '';

        // Si l'année est sur 2 chiffres, la convertir en 4 chiffres
        if (year.length === 2) {
          const yearNum = parseInt(year);
          year = yearNum >= 0 && yearNum <= 30 ? `20${year}` : `19${year}`;
        }

        // Filtrer uniquement les années valides (2019-2026)
        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 2019 || yearNum > 2026) {
          return; // Ignorer cette entrée
        }

        // Vérifier si c'est un triathlon
        const isTriathlon = triathlonKeywords.some(keyword =>
          event.event.toLowerCase().includes(keyword)
        );

        // Agréger toutes les courses
        if (!yearlyMap.has(year)) {
          yearlyMap.set(year, { participants: 0, revenue: 0, buyers: 0 });
        }
        const yearData = yearlyMap.get(year)!;
        yearData.participants += event.participants;
        yearData.revenue += event.revenue; // Déjà converti dans googleSheets.ts
        yearData.buyers += event.buyers;

        // Agréger les triathlons
        if (isTriathlon) {
          if (!yearlyTriathlonMap.has(year)) {
            yearlyTriathlonMap.set(year, { participants: 0, revenue: 0, buyers: 0 });
          }
          const triathlonData = yearlyTriathlonMap.get(year)!;
          triathlonData.participants += event.participants;
          triathlonData.revenue += event.revenue; // Déjà converti dans googleSheets.ts
          triathlonData.buyers += event.buyers;
        }
      });

      // Convertir en tableaux pour le composant YearlyComparison
      const allCoursesYearly = Array.from(yearlyMap.entries()).map(([year, data]) => ({
        year,
        participants: data.participants,
        revenue: data.revenue,
        buyers: data.buyers,
        revenuePerParticipant: data.participants > 0 ? data.revenue / data.participants : 0,
        buyerPercentage: data.participants > 0 ? (data.buyers / data.participants) * 100 : 0,
        avgOrder: data.buyers > 0 ? data.revenue / data.buyers : 0
      }));

      const triatlonYearly = Array.from(yearlyTriathlonMap.entries()).map(([year, data]) => ({
        year,
        participants: data.participants,
        revenue: data.revenue,
        buyers: data.buyers,
        revenuePerParticipant: data.participants > 0 ? data.revenue / data.participants : 0,
        buyerPercentage: data.participants > 0 ? (data.buyers / data.participants) * 100 : 0,
        avgOrder: data.buyers > 0 ? data.revenue / data.buyers : 0
      }));

      setYearlyStats({
        allCourses: allCoursesYearly,
        triathlons: triatlonYearly
      });

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    window.location.reload();
  };

  // Mots-clés pour identifier les triathlons
  const triathlonKeywords = ['triathlon', 'swimrun', 't24', 'ventouxman', 'bayman'];

  // Filtrage et groupement par année si nécessaire
  let displayEvents: EventStats[] = [];

  // Si une année est sélectionnée, afficher le détail des courses de cette année
  if (selectedYear) {
    displayEvents = (stats?.allEvents ?? []).filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const yearMatch = event.name.match(/20\d{2}/);
      const eventYear = yearMatch ? yearMatch[0] : '';
      const matchesYear = eventYear === selectedYear;

      if (showTriathlonsOnly) {
        const isTriathlon = triathlonKeywords.some(keyword =>
          event.name.toLowerCase().includes(keyword)
        );
        return matchesSearch && matchesYear && isTriathlon;
      }

      return matchesSearch && matchesYear;
    });
  } else if (groupByYear) {
    // Grouper par année
    const yearMap = new Map<string, {
      ca: number;
      buyers: number;
      orders: number;
      participants: number;
    }>();

    (stats?.allEvents ?? []).forEach(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (showTriathlonsOnly) {
        const isTriathlon = triathlonKeywords.some(keyword =>
          event.name.toLowerCase().includes(keyword)
        );
        if (!matchesSearch || !isTriathlon) return;
      } else if (!matchesSearch) {
        return;
      }

      // Extraire l'année du nom de l'événement
      const yearMatch = event.name.match(/20\d{2}/);
      const year = yearMatch ? yearMatch[0] : null;

      // Ignorer les événements sans année
      if (!year) return;

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          ca: 0,
          buyers: 0,
          orders: 0,
          participants: 0
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.ca += event.ca;
      yearData.buyers += event.buyers;
      yearData.orders += event.orders;
      yearData.participants += event.participants;
    });

    // Convertir en tableau
    displayEvents = Array.from(yearMap.entries()).map(([year, data]) => ({
      name: year,
      ca: data.ca,
      buyers: data.buyers,
      orders: data.orders,
      avgOrder: data.buyers > 0 ? data.ca / data.buyers : 0,
      participants: data.participants,
      revenuePerParticipant: data.participants > 0 ? data.ca / data.participants : 0,
      buyerPercentage: data.participants > 0 ? Math.round((data.buyers / data.participants) * 10000) / 100 : 0
    })).sort((a, b) => b.name.localeCompare(a.name)); // Trier par année décroissante
  } else {
    // Affichage par course (mode normal)
    displayEvents = (stats?.allEvents ?? []).filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (showTriathlonsOnly) {
        const isTriathlon = triathlonKeywords.some(keyword =>
          event.name.toLowerCase().includes(keyword)
        );
        return matchesSearch && isTriathlon;
      }

      return matchesSearch;
    });
  }

  // Fonction de tri
  const handleSort = (column: 'ca' | 'buyers' | 'avgOrder' | 'participants' | 'revenuePerParticipant' | 'buyerPercentage') => {
    if (sortColumn === column) {
      // Si on clique sur la même colonne, inverser la direction
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // Nouvelle colonne, commencer par décroissant
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Appliquer le tri
  let filteredEvents = [...displayEvents];
  if (sortColumn) {
    filteredEvents.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (sortDirection === 'desc') {
        return bVal - aVal;
      } else {
        return aVal - bVal;
      }
    });
  }

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset page when search, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showTriathlonsOnly, groupByYear, selectedYear ?? '', sortColumn ?? '', sortDirection]);

  // Fonction helper pour afficher l'icône de tri
  const renderSortIcon = (column: 'ca' | 'buyers' | 'avgOrder' | 'participants' | 'revenuePerParticipant' | 'buyerPercentage') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="w-3 h-3 ml-1 inline text-red-600" />
    ) : (
      <ArrowUp className="w-3 h-3 ml-1 inline text-red-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900">Chargement des données...</p>
          <p className="text-sm text-gray-500 mt-2">Récupération depuis Google Sheets</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <p className="text-red-600 mb-6 text-lg">{error}</p>
            <Button onClick={loadData} size="lg">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Couleurs par année (2019-2026)
  const YEAR_COLORS: { [key: string]: string } = {
    '2019': '#DC2626', // Rouge
    '2020': '#F59E0B', // Orange
    '2021': '#10B981', // Vert
    '2022': '#3B82F6', // Bleu
    '2023': '#8B5CF6', // Violet
    '2024': '#EC4899', // Rose
    '2025': '#06B6D4', // Cyan
    '2026': '#EF4444', // Rouge clair
  };

  const getEventColor = (eventName: string): string => {
    // Extraire l'année du nom de l'événement
    const yearMatch = eventName.match(/20\d{2}/);
    if (yearMatch) {
      return YEAR_COLORS[yearMatch[0]] || '#6B7280'; // Gris par défaut
    }
    return '#6B7280'; // Gris si pas d'année
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                PhotoRunning
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecordsModal(true)}
                className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800 font-semibold"
              >
                <Trophy className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Records du site actuel</span>
                <span className="sm:hidden">Records</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Records */}
      {showRecordsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowRecordsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Records du site actuel</h2>
              </div>
              <button
                onClick={() => setShowRecordsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Contenu des records */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {records.map((record, index) => {
                // Déterminer l'icône en fonction du type
                let Icon = Trophy;
                if (record.type.toLowerCase().includes('journée')) {
                  Icon = Star;
                } else if (record.type.toLowerCase().includes('mois')) {
                  Icon = Award;
                }

                return (
                  <div key={index} className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-200 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Icon className="w-5 h-5 text-yellow-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{record.type}</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{record.value}</p>
                    <p className="text-sm text-gray-600">{record.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* CA */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-red-50">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600">CA</CardTitle>
                <div className="p-1 sm:p-2 bg-red-100 rounded-lg">
                  <Euro className="w-3 h-3 sm:w-5 sm:h-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {/* Année en cours */}
              <div className="mb-3 pb-3 border-b border-red-200">
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">{new Date().getFullYear()}</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {(stats?.currentYearCA ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">{(stats?.currentYearOrders ?? 0).toLocaleString('fr-FR')} cmd</p>
              </div>
              {/* Total */}
              <div>
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">Total</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-700">
                  {(stats?.totalCA ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">{(stats?.totalOrders ?? 0).toLocaleString('fr-FR')} cmd</p>
              </div>
            </CardContent>
          </Card>

          {/* Acheteurs */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600">Acheteurs</CardTitle>
                <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                  <Users className="w-3 h-3 sm:w-5 sm:h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {/* Année en cours */}
              <div className="mb-3 pb-3 border-b border-green-200">
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">{new Date().getFullYear()}</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {(stats?.currentYearBuyers ?? 0).toLocaleString('fr-FR')}
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">Clients uniques</p>
              </div>
              {/* Total */}
              <div>
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">Total</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-700">
                  {(stats?.totalBuyers ?? 0).toLocaleString('fr-FR')}
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">Clients uniques</p>
              </div>
            </CardContent>
          </Card>

          {/* Panier Moyen */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600">Panier Moy.</CardTitle>
                <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {/* Année en cours */}
              <div className="mb-3 pb-3 border-b border-blue-200">
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">{new Date().getFullYear()}</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {(stats?.currentYearPanierMoyen ?? 0).toFixed(0)} €
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">Par commande</p>
              </div>
              {/* Total */}
              <div>
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">Total</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-700">
                  {(stats?.panierMoyen ?? 0).toFixed(0)} €
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">Par commande</p>
              </div>
            </CardContent>
          </Card>

          {/* Événements */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600">Événements</CardTitle>
                <div className="p-1 sm:p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {/* Année en cours */}
              <div className="mb-3 pb-3 border-b border-purple-200">
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">{new Date().getFullYear()}</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {stats?.currentYearEvents ?? 0}
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">
                  CA moy: {(stats?.currentYearEvents ?? 0) > 0 ? ((stats?.currentYearCA ?? 0) / (stats?.currentYearEvents ?? 1)).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) : 0} €
                </p>
              </div>
              {/* Total */}
              <div>
                <p className="text-[8px] sm:text-xs text-gray-500 mb-1">Total</p>
                <div className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-700">
                  {stats?.nombreEvenements ?? 0}
                </div>
                <p className="text-[8px] sm:text-xs text-gray-500">
                  CA moy: {(stats?.nombreEvenements ?? 0) > 0 ? ((stats?.totalCA ?? 0) / (stats?.nombreEvenements ?? 1)).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) : 0} €
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Évolution du CA accumulé - Hidden on mobile */}
        {!isMobile && (
          <div className="grid grid-cols-1 mb-6 sm:mb-8">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Évolution du CA Accumulé</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Progression du chiffre d'affaires dans le temps</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {(stats?.totalCA ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                    </div>
                    <div className="text-xs text-gray-500">Total actuel</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 px-2 sm:px-6">
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-[500px] sm:min-w-0">
                    <ResponsiveContainer width="100%" height={300} className="sm:!h-[350px] lg:!h-[400px]">
                      <AreaChart
                        data={cumulativeData}
                        margin={{
                          top: 10,
                          right: 60,
                          left: 0,
                          bottom: 0
                        }}
                      >
                        <defs>
                          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorYearly" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          height={40}
                          interval={0}
                          angle={0}
                          textAnchor="middle"
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.05)]}
                          width={60}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                          width={60}
                        />
                        <Tooltip
                          formatter={(value: any, name?: string | number) => {
                            const formattedValue = `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
                            const label = name === 'cumulative' ? 'CA Accumulé' : name === 'yearly' ? 'CA Annuel' : '';
                            return [formattedValue, label];
                          }}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          formatter={(value) => value === 'cumulative' ? 'CA Accumulé' : 'CA Annuel'}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                        <Area
                          yAxisId="left"
                          type="linear"
                          dataKey="cumulative"
                          stroke="#10B981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorCumulative)"
                          name="cumulative"
                        />
                        <Area
                          yAxisId="right"
                          type="linear"
                          dataKey="yearly"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          fillOpacity={0.3}
                          fill="url(#colorYearly)"
                          name="yearly"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comparaison Annuelle */}
        <YearlyComparison
          allCoursesData={yearlyStats.allCourses}
          triatlonData={yearlyStats.triathlons}
        />

        {/* Tableau Détaillé */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle className="text-base sm:text-lg font-semibold">Détail des Événements</CardTitle>

              {/* Barre de recherche et filtres */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant={showTriathlonsOnly ? "default" : "outline"}
                    onClick={() => setShowTriathlonsOnly(!showTriathlonsOnly)}
                    className={`flex-1 sm:flex-none text-xs sm:text-sm ${showTriathlonsOnly ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}`}
                  >
                    <span className="hidden sm:inline">{showTriathlonsOnly ? "Tous les événements" : "Voir les triathlons"}</span>
                    <span className="sm:hidden">{showTriathlonsOnly ? "Tous" : "Triathlons"}</span>
                  </Button>
                  <Button
                    variant={groupByYear ? "default" : "outline"}
                    onClick={() => setGroupByYear(!groupByYear)}
                    className={`flex-1 sm:flex-none text-xs sm:text-sm ${groupByYear ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                  >
                    {groupByYear ? "Par course" : "Par année"}
                  </Button>
                </div>
              </div>

              {/* Affichage du fil d'Ariane et compteur */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-600">
                  {selectedYear ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedYear(null)}
                        className="text-xs"
                      >
                        ← Retour aux années
                      </Button>
                      <span>Année {selectedYear} - {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}</span>
                    </div>
                  ) : (searchQuery || showTriathlonsOnly || groupByYear) ? (
                    <span className="text-xs sm:text-sm">
                      {filteredEvents.length} {groupByYear ? 'année' : 'événement'}{filteredEvents.length > 1 ? 's' : ''} <span className="hidden sm:inline">{showTriathlonsOnly ? '(Triathlons / Swimrun / T24 / Ventouxman / Bayman)' : filteredEvents.length > 1 && !groupByYear ? 'trouvés' : filteredEvents.length === 1 && !groupByYear ? 'trouvé' : ''}</span>
                    </span>
                  ) : null}
                </div>

              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Événement
                    </th>
                    <th
                      className="px-2 sm:px-6 py-2 sm:py-4 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('ca')}
                    >
                      <span className="flex items-center justify-end">
                        CA
                        {renderSortIcon('ca')}
                      </span>
                    </th>
                    <th
                      className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-4 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('buyers')}
                    >
                      <span className="flex items-center justify-end">
                        Acheteurs
                        {renderSortIcon('buyers')}
                      </span>
                    </th>
                    <th
                      className="hidden lg:table-cell px-2 sm:px-6 py-2 sm:py-4 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('avgOrder')}
                    >
                      <span className="flex items-center justify-end">
                        Panier moy.
                        {renderSortIcon('avgOrder')}
                      </span>
                    </th>
                    <th
                      className="hidden lg:table-cell px-2 sm:px-6 py-2 sm:py-4 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('participants')}
                    >
                      <span className="flex items-center justify-end">
                        Participants
                        {renderSortIcon('participants')}
                      </span>
                    </th>
                    <th
                      className="hidden lg:table-cell px-2 sm:px-6 py-2 sm:py-4 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('buyerPercentage')}
                    >
                      <span className="flex items-center justify-end">
                        % Acheteurs
                        {renderSortIcon('buyerPercentage')}
                      </span>
                    </th>
                    <th
                      className="hidden lg:table-cell px-2 sm:px-6 py-2 sm:py-4 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('revenuePerParticipant')}
                    >
                      <span className="flex items-center justify-end">
                        € / coureur
                        {renderSortIcon('revenuePerParticipant')}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {/* Ligne totale */}
                  <tr className="bg-gradient-to-r from-red-50 to-rose-50 font-bold border-b-2 border-red-200">
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 max-w-[120px] sm:max-w-none">
                      <span className="truncate block">TOTAL {selectedYear ? `(${selectedYear})` : showTriathlonsOnly ? '(Tri.)' : groupByYear ? '(An.)' : ''}</span>
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right">
                      {filteredEvents.reduce((sum, e) => sum + e.ca, 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                    </td>
                    <td className="hidden sm:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right">
                      {filteredEvents.reduce((sum, e) => sum + e.buyers, 0).toLocaleString('fr-FR')}
                    </td>
                    <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right">
                      {(() => {
                        const totalCA = filteredEvents.reduce((sum, e) => sum + e.ca, 0);
                        const totalBuyers = filteredEvents.reduce((sum, e) => sum + e.buyers, 0);
                        return totalBuyers > 0 ? `${(totalCA / totalBuyers).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-';
                      })()}
                    </td>
                    <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right">
                      {filteredEvents.reduce((sum, e) => sum + e.participants, 0).toLocaleString('fr-FR')}
                    </td>
                    <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right">
                      {(() => {
                        const totalBuyers = filteredEvents.reduce((sum, e) => sum + e.buyers, 0);
                        const totalParticipants = filteredEvents.reduce((sum, e) => sum + e.participants, 0);
                        return totalParticipants > 0 ? `${((totalBuyers / totalParticipants) * 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '-';
                      })()}
                    </td>
                    <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right">
                      {(() => {
                        const totalCA = filteredEvents.reduce((sum, e) => sum + e.ca, 0);
                        const totalParticipants = filteredEvents.reduce((sum, e) => sum + e.participants, 0);
                        return totalParticipants > 0 ? `${(totalCA / totalParticipants).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-';
                      })()}
                    </td>
                  </tr>
                  {paginatedEvents.map((event, index) => {
                    const isExpanded = expandedEventIndex === index;
                    return (
                      <Fragment key={index}>
                        <tr
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (groupByYear && !selectedYear) {
                              setSelectedYear(event.name);
                            } else if (isMobile) {
                              // Sur mobile : expand pour voir les détails
                              setExpandedEventIndex(isExpanded ? null : index);
                            } else {
                              // Sur desktop : ouvrir directement la popup
                              setSelectedEvent(event.name);
                            }
                          }}
                        >
                          <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 max-w-[120px] sm:max-w-none">
                            <div className="flex items-center gap-1 sm:gap-3 min-w-0">
                              {isMobile && <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: getEventColor(event.name) }} />
                              <span className="truncate min-w-0">{event.name}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right font-semibold">
                            {event.ca.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                            {event.buyers.toLocaleString('fr-FR')}
                          </td>
                          <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                            {event.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </td>
                          <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                            {event.participants > 0 ? event.participants.toLocaleString('fr-FR') : '-'}
                          </td>
                          <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                            {event.buyerPercentage > 0 ? `${event.buyerPercentage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '-'}
                          </td>
                          <td className="hidden lg:table-cell px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                            {event.revenuePerParticipant > 0 ? `${event.revenuePerParticipant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-'}
                          </td>
                        </tr>
                        {/* Expanded row with details - Mobile only */}
                        {isMobile && isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-2 sm:px-6 py-3 sm:py-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                                <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200">
                                  <p className="text-[8px] sm:text-xs text-gray-500">Acheteurs</p>
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{event.buyers.toLocaleString('fr-FR')}</p>
                                </div>
                                <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200">
                                  <p className="text-[8px] sm:text-xs text-gray-500">Panier moyen</p>
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{event.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                                </div>
                                <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200">
                                  <p className="text-[8px] sm:text-xs text-gray-500">Participants</p>
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{event.participants > 0 ? event.participants.toLocaleString('fr-FR') : '-'}</p>
                                </div>
                                <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200">
                                  <p className="text-[8px] sm:text-xs text-gray-500">% Acheteurs</p>
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{event.buyerPercentage > 0 ? `${event.buyerPercentage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '-'}</p>
                                </div>
                                <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200">
                                  <p className="text-[8px] sm:text-xs text-gray-500">€ / coureur</p>
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{event.revenuePerParticipant > 0 ? `${event.revenuePerParticipant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-'}</p>
                                </div>
                              </div>
                              {!groupByYear && (
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event.name);
                                    }}
                                    className="text-xs gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Voir l'historique
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredEvents.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  <span className="hidden sm:inline">Affichage de {startIndex + 1} à {Math.min(endIndex, filteredEvents.length)} sur {filteredEvents.length} événements</span>
                  <span className="sm:hidden">{startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} / {filteredEvents.length}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-xs px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-1">Précédent</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Afficher seulement quelques pages autour de la page actuelle
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${
                              currentPage === page
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-gray-400 text-xs">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline mr-1">Suivant</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de détail d'événement */}
      {selectedEvent && (
        <EventDetailView
          eventName={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
