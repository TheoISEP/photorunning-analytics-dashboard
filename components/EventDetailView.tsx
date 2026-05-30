'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
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

  useEffect(() => {
    loadHistoricalData();
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
        const eventBaseName = event.event.replace(/\s*20\d{2}\s*$/, '').trim();
        const normalizedEventName = normalizeEventName(eventBaseName, aliasMap);

        if (normalizedEventName.toLowerCase() === normalizedBaseName.toLowerCase()) {
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
        const normalizedEventName = normalizeEventName(event.event, aliasMap);
        const eventBaseName = normalizedEventName.replace(/\s*20\d{2}\s*$/, '').trim();

        if (eventBaseName.toLowerCase() === normalizedBaseName.toLowerCase()) {
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <Card className="w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] overflow-hidden bg-white sm:shadow-2xl sm:rounded-lg">
        <CardHeader className="border-b border-gray-200 sticky top-0 bg-white z-10 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-2xl font-bold text-gray-900">{eventName}</CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Comparatif année par année</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 overflow-y-auto h-[calc(100vh-80px)] sm:h-auto sm:max-h-[calc(90vh-120px)] bg-white">
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
              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Évolution du CA */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base font-semibold">Évolution du CA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                      <LineChart data={[...yearlyData].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} className="sm:text-xs" />
                        <YAxis tick={{ fontSize: 10 }} className="sm:text-xs" />
                        <Tooltip
                          formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} dot={{ r: 4, fill: '#DC2626' }} className="sm:!stroke-[3]" />
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
                    <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                      <BarChart data={[...yearlyData].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} className="sm:text-xs" />
                        <YAxis tick={{ fontSize: 10 }} className="sm:text-xs" />
                        <Tooltip
                          formatter={(value: number) => value.toLocaleString('fr-FR')}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Bar dataKey="buyers" fill="#10B981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Tableau détaillé */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[768px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Année
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CA (€)
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Évol. CA
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acheteurs
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      % Ach.
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Panier moy.
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      € / coureur
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {yearlyData.map((data, index) => {
                    const previousYear = yearlyData[index + 1];
                    const caEvolution = previousYear ? calculateEvolution(data.revenue, previousYear.revenue) : null;

                    return (
                      <tr key={data.year} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                          {data.year}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right font-semibold">
                          {data.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right">
                          {caEvolution !== null ? (
                            <span className={`inline-flex items-center gap-0.5 sm:gap-1 ${caEvolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {caEvolution >= 0 ? (
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                              <span className="text-[10px] sm:text-xs">{caEvolution >= 0 ? '+' : ''}{caEvolution.toFixed(1)}%</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                          {data.participants.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                          {data.buyers.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right">
                          <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800">
                            {data.buyerPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                          {data.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                          {data.revenuePerParticipant > 0 ? `${data.revenuePerParticipant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-'}
                        </td>
                      </tr>
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
