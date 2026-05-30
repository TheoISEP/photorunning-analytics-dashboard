'use client';

import { useState, useMemo } from 'react';
import { AggregatedEventData } from '@/types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateEventEvolution, calculateYearlyEvolution } from '@/lib/dataProcessing';
import { Search } from 'lucide-react';

interface EvolutionTabProps {
  events: AggregatedEventData[];
}

export default function EvolutionTab({ events }: EvolutionTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Calculer l'évolution globale par année
  const yearlyEvolution = useMemo(() => calculateYearlyEvolution(events), [events]);

  // Calculer l'évolution par événement
  const eventEvolutions = useMemo(() => calculateEventEvolution(events), [events]);

  // Filtrer les événements avec plusieurs années de données
  const multiYearEvents = useMemo(() => {
    return eventEvolutions
      .filter(ev => ev.yearlyData.length > 1)
      .filter(ev => ev.eventName.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const sumA = a.yearlyData.reduce((sum, y) => sum + y.revenue, 0);
        const sumB = b.yearlyData.reduce((sum, y) => sum + y.revenue, 0);
        return sumB - sumA;
      });
  }, [eventEvolutions, searchQuery]);

  // Événement sélectionné pour le détail
  const selectedEventData = useMemo(() => {
    if (!selectedEvent) return null;
    return eventEvolutions.find(ev => ev.eventName === selectedEvent);
  }, [selectedEvent, eventEvolutions]);

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Évolution</h2>
        <p className="text-gray-600 mt-1">Analyse de l'évolution du CA au fil des années</p>
      </div>

      {/* Évolution globale */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution globale</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearlyEvolution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [`${value.toLocaleString('fr-FR')} €`, 'CA'];
                if (name === 'buyers') return [value.toLocaleString('fr-FR'), 'Acheteurs'];
                if (name === 'events') return [value, 'Événements'];
                return [value, name];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="CA"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="buyers"
              name="Acheteurs"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="events"
              name="Événements"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau global par année */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques annuelles</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA (€)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Événements
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acheteurs
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Panier moyen (€)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA/Événement (€)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {yearlyEvolution.map((year) => (
                <tr key={year.year} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {year.year}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {year.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {year.events}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {year.buyers.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {year.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {(year.revenue / year.events).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Évolution par événement */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution par événement</h3>

        {/* Recherche */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Liste des événements */}
        <div className="space-y-4">
          {multiYearEvents.map((eventEvolution) => {
            const isSelected = selectedEvent === eventEvolution.eventName;
            const totalRevenue = eventEvolution.yearlyData.reduce((sum, y) => sum + y.revenue, 0);

            return (
              <div key={eventEvolution.eventName} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedEvent(isSelected ? null : eventEvolution.eventName)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition flex justify-between items-center text-left"
                >
                  <div>
                    <span className="font-medium text-gray-900">{eventEvolution.eventName}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      {eventEvolution.yearlyData.length} années
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>
                    <div className="text-xs text-gray-500">CA total</div>
                  </div>
                </button>

                {isSelected && (
                  <div className="p-4 border-t border-gray-200">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={eventEvolution.yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                        />
                        <Bar dataKey="revenue" name="CA" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Année</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">CA (€)</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Acheteurs</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Panier moyen (€)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {eventEvolution.yearlyData.map((yearData) => (
                            <tr key={yearData.year} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900">{yearData.year}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 text-right">
                                {yearData.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600 text-right">
                                {yearData.buyers}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600 text-right">
                                {yearData.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {multiYearEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun événement trouvé avec plusieurs années de données
          </div>
        )}
      </div>
    </div>
  );
}
