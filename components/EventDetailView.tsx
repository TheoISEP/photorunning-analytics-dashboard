'use client';

import { useEffect, useState, Fragment } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchPastData, fetchNowData, fetchAliaseData, normalizeEventName } from '@/lib/googleSheets';
import { PastEventData } from '@/types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EventDetailViewProps {
  eventName: string;
  onClose: () => void;
}

interface YearlyData {
  year: string;
  revenue: number;
  buyers: number;
  participants: number;
  avgOrder: number;
  buyerPercentage: number;
  revenuePerParticipant: number;
}

export default function EventDetailView({ eventName, onClose }: EventDetailViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedYearIndex, setExpandedYearIndex] = useState<number | null>(null);

  useEffect(() => {
    loadHistoricalData();

    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [eventName]);

  const loadHistoricalData = async () => {
    try {
      setIsLoading(true);
      const [pastData, nowData, aliasMap] = await Promise.all([
        fetchPastData(),
        fetchNowData(),
        fetchAliaseData()
      ]);

      // Extraire le nom de base de l'événement (sans l'année)
      const baseEventName = eventName.replace(/\s*20\d{2}\s*$/, '').trim();
      const normalizedBaseName = normalizeEventName(baseEventName, aliasMap);

      // Collecter toutes les années pour cet événement
      const yearlyMap = new Map<string, {
        revenue: number;
        buyers: Set<string>;
        participants: number;
        orders: number;
      }>();

      // Ajouter les données historiques (Past)
      pastData.forEach(event => {
        // Normaliser le nom complet de l'événement (avec l'année)
        const normalizedFullEventName = normalizeEventName(event.event, aliasMap);

        // Vérifier si le nom normalisé commence par le nom recherché (avec ou sans année)
        const eventNameWithoutYear = normalizedFullEventName.replace(/\s*20\d{2}\s*$/, '').trim();
        const searchNameWithoutYear = normalizedBaseName.replace(/\s*20\d{2}\s*$/, '').trim();

        // Match si le nom de base correspond OU si le nom complet commence par le nom recherché
        const isMatch =
          eventNameWithoutYear.toLowerCase().startsWith(searchNameWithoutYear.toLowerCase()) ||
          normalizedFullEventName.toLowerCase().startsWith(normalizedBaseName.toLowerCase());

        if (isMatch) {
          // Extraire l'année du nom de l'événement en priorité
          const yearMatch = event.event.match(/20\d{2}/);
          let year = yearMatch ? yearMatch[0] : null;

          // Si pas d'année dans le nom, essayer depuis la date (format: DD/MM/YYYY ou DD/MM/YY)
          if (!year && event.date) {
            const dateParts = event.date.split('/');
            if (dateParts.length >= 3) {
              let yearStr = dateParts[2];
              if (yearStr.length === 2) {
                const yearNum = parseInt(yearStr);
                yearStr = yearNum >= 0 && yearNum <= 30 ? `20${yearStr}` : `19${yearStr}`;
              }
              year = yearStr;
            }
          }

          // Ignorer si on n'arrive pas à extraire une année valide
          if (!year || !year.match(/^20\d{2}$/)) return;

          if (!yearlyMap.has(year)) {
            yearlyMap.set(year, {
              revenue: 0,
              buyers: new Set(),
              participants: 0,
              orders: 0
            });
          }

          const yearData = yearlyMap.get(year)!;
          yearData.revenue += event.revenue;
          yearData.participants += event.participants;
          // Pour Past, ajouter les buyers (pas remplacer!)
          for (let i = 0; i < event.buyers; i++) {
            yearData.buyers.add(`${year}_past_buyer_${yearData.buyers.size + i}`);
          }
        }
      });

      // Ajouter les données actuelles (Now)
      nowData.forEach(event => {
        // Normaliser le nom complet de l'événement (avec l'année)
        const normalizedFullEventName = normalizeEventName(event.event, aliasMap);

        // Vérifier si le nom normalisé commence par le nom recherché (avec ou sans année)
        const eventNameWithoutYear = normalizedFullEventName.replace(/\s*20\d{2}\s*$/, '').trim();
        const searchNameWithoutYear = normalizedBaseName.replace(/\s*20\d{2}\s*$/, '').trim();

        // Match si le nom de base correspond OU si le nom complet commence par le nom recherché
        const isMatch =
          eventNameWithoutYear.toLowerCase().startsWith(searchNameWithoutYear.toLowerCase()) ||
          normalizedFullEventName.toLowerCase().startsWith(normalizedBaseName.toLowerCase());

        if (isMatch) {
          // Extraire l'année du nom de l'événement en priorité
          const yearMatch = event.event.match(/20\d{2}/);
          let year = yearMatch ? yearMatch[0] : null;

          // Si pas d'année dans le nom, essayer depuis la date (format: DD/MM/YYYY ou DD/MM/YY)
          if (!year && event.date) {
            const dateParts = event.date.split('/');
            if (dateParts.length >= 3) {
              let yearStr = dateParts[2];
              if (yearStr.length === 2) {
                const yearNum = parseInt(yearStr);
                yearStr = yearNum >= 0 && yearNum <= 30 ? `20${yearStr}` : `19${yearStr}`;
              }
              year = yearStr;
            }
          }

          // Par défaut 2026 si vraiment aucune année trouvée
          if (!year) year = '2026';

          // Ignorer si année invalide
          if (!year.match(/^20\d{2}$/)) return;

          if (!yearlyMap.has(year)) {
            yearlyMap.set(year, {
              revenue: 0,
              buyers: new Set(),
              participants: 0,
              orders: 0
            });
          }

          const yearData = yearlyMap.get(year)!;
          yearData.revenue += event.totalRevenue;
          yearData.orders += event.orders;
          yearData.participants += event.participants;
          // Pour Now, ajouter les buyers basés sur le nombre de commandes
          for (let i = 0; i < event.orders; i++) {
            yearData.buyers.add(`${year}_now_buyer_${yearData.buyers.size + i}`);
          }
        }
      });

      // Convertir en tableau et calculer les statistiques
      const eventHistory = Array.from(yearlyMap.entries())
        .filter(([year]) => year.match(/^20\d{2}$/)) // Garder seulement les années valides (format 20XX)
        .map(([year, data]) => {
          const buyers = data.buyers.size;
          const participants = data.participants || buyers; // Si pas de participants, utiliser buyers

          return {
            year,
            revenue: Math.round(data.revenue * 100) / 100,
            buyers,
            participants,
            avgOrder: buyers > 0 ? Math.round((data.revenue / buyers) * 100) / 100 : 0,
            buyerPercentage: participants > 0 ? Math.round((buyers / participants) * 10000) / 100 : 0,
            revenuePerParticipant: participants > 0 ? Math.round((data.revenue / participants) * 100) / 100 : 0
          };
        })
        .sort((a, b) => b.year.localeCompare(a.year)); // Trier par année décroissante

      setYearlyData(eventHistory);
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEvolution = (current: number, previous: number) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-white shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-gray-200 sticky top-0 bg-white z-10 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900">{eventName}</CardTitle>
              <p className="text-xs text-gray-600 mt-1">Comparatif année par année</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-80px)] bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : yearlyData.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune donnée historique disponible pour cet événement</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Graphiques - Hidden on mobile */}
              {!isMobile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Évolution du CA */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base font-semibold">Évolution du CA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={[...yearlyData].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value: any) => `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} dot={{ r: 4, fill: '#DC2626' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Évolution des acheteurs */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base font-semibold">Évolution des acheteurs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[...yearlyData].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value: any) => Number(value).toLocaleString('fr-FR')}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Bar dataKey="buyers" fill="#10B981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tableau détaillé */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Année
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CA
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 py-2 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Évol.
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acheteurs
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 py-2 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      % Acheteurs
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 py-2 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      € / coureur
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 py-2 text-right text-[9px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Panier moy.
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {yearlyData.map((data, index) => {
                    const previousYear = yearlyData[index + 1];
                    const caEvolution = previousYear ? calculateEvolution(data.revenue, previousYear.revenue) : null;
                    const isExpanded = expandedYearIndex === index;

                    return (
                      <Fragment key={data.year}>
                        <tr
                          className="hover:bg-gray-50 transition-colors cursor-pointer sm:cursor-default"
                          onClick={() => {
                            if (isMobile) {
                              setExpandedYearIndex(isExpanded ? null : index);
                            }
                          }}
                        >
                          <td className="px-2 sm:px-4 py-2 text-[9px] sm:text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-1">
                              {isMobile && <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                              <span>{data.year}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-[9px] sm:text-sm text-gray-900 text-right font-semibold">
                            {data.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 py-2 text-[9px] sm:text-sm text-right">
                            {caEvolution !== null ? (
                              <span className={`inline-flex items-center gap-0.5 ${caEvolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {caEvolution >= 0 ? (
                                  <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" />
                                ) : (
                                  <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3" />
                                )}
                                <span className="text-[8px] sm:text-xs">{caEvolution >= 0 ? '+' : ''}{caEvolution.toFixed(1)}%</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-[9px] sm:text-sm text-gray-600 text-right">
                            {data.buyers.toLocaleString('fr-FR')}
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 py-2 text-[9px] sm:text-sm text-gray-600 text-right">
                            {data.buyerPercentage > 0 ? `${data.buyerPercentage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '-'}
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 py-2 text-[9px] sm:text-sm text-gray-600 text-right">
                            {data.revenuePerParticipant > 0 ? `${data.revenuePerParticipant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-'}
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 py-2 text-[9px] sm:text-sm text-gray-600 text-right">
                            {data.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </td>
                        </tr>
                        {/* Expanded row with details - Mobile only */}
                        {isMobile && isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={4} className="px-2 py-3">
                              <div className="grid grid-cols-2 gap-2">
                                {caEvolution !== null && (
                                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                                    <p className="text-[8px] text-gray-500">Évolution CA</p>
                                    <p className={`text-xs font-semibold ${caEvolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {caEvolution >= 0 ? '+' : ''}{caEvolution.toFixed(1)}%
                                    </p>
                                  </div>
                                )}
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                  <p className="text-[8px] text-gray-500">% Acheteurs</p>
                                  <p className="text-xs font-semibold text-gray-900">
                                    {data.buyerPercentage > 0 ? `${data.buyerPercentage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '-'}
                                  </p>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                  <p className="text-[8px] text-gray-500">€ / coureur</p>
                                  <p className="text-xs font-semibold text-gray-900">
                                    {data.revenuePerParticipant > 0 ? `${data.revenuePerParticipant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-'}
                                  </p>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                  <p className="text-[8px] text-gray-500">Panier moyen</p>
                                  <p className="text-xs font-semibold text-gray-900">
                                    {data.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
