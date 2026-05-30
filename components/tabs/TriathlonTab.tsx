'use client';

import { useMemo } from 'react';
import { AggregatedEventData } from '@/types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateYearlyEvolution, calculateEventEvolution } from '@/lib/dataProcessing';
import { Award, TrendingUp, Users, Euro } from 'lucide-react';

interface TriathlonTabProps {
  events: AggregatedEventData[];
}

export default function TriathlonTab({ events }: TriathlonTabProps) {
  // Statistiques globales des triathlons
  const stats = useMemo(() => {
    const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
    const totalBuyers = events.reduce((sum, e) => sum + e.buyers, 0);
    const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0);
    const avgOrder = totalBuyers > 0 ? totalRevenue / totalBuyers : 0;

    return {
      totalRevenue,
      totalBuyers,
      totalParticipants,
      avgOrder,
      totalEvents: events.length,
    };
  }, [events]);

  // Évolution annuelle des triathlons
  const yearlyEvolution = useMemo(() => calculateYearlyEvolution(events), [events]);

  // Top triathlons par CA
  const topTriathlons = useMemo(() => {
    return [...events]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [events]);

  // Évolution par triathlon
  const eventEvolutions = useMemo(() => {
    return calculateEventEvolution(events)
      .filter(ev => ev.yearlyData.length > 1)
      .sort((a, b) => {
        const sumA = a.yearlyData.reduce((sum, y) => sum + y.revenue, 0);
        const sumB = b.yearlyData.reduce((sum, y) => sum + y.revenue, 0);
        return sumB - sumA;
      })
      .slice(0, 10);
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Triathlons & SwimRun</h2>
        <p className="text-gray-600 mt-1">Analyse des événements triathlons et swimrun</p>
      </div>

      {/* Cartes de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">CA Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Euro className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Événements</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEvents}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Acheteurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalBuyers.toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Évolution annuelle */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution annuelle des triathlons</h3>
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
              stroke="#9333ea"
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

      {/* Top triathlons */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 15 triathlons par CA</h3>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={topTriathlons} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="event"
              width={200}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
            />
            <Bar dataKey="revenue" name="CA" fill="#9333ea" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tous les triathlons</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA (€)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acheteurs
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux d'achat (%)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Panier moyen (€)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events
                .sort((a, b) => b.revenue - a.revenue)
                .map((event, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{event.event}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{event.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {event.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {event.buyers.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {event.participants.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {event.buyerPercentage.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {event.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Évolution des triathlons récurrents */}
      {eventEvolutions.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution des triathlons récurrents (top 10)
          </h3>
          <div className="space-y-6">
            {eventEvolutions.map((eventEvolution) => {
              const totalRevenue = eventEvolution.yearlyData.reduce((sum, y) => sum + y.revenue, 0);
              return (
                <div key={eventEvolution.eventName} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900">{eventEvolution.eventName}</h4>
                    <p className="text-sm text-gray-500">
                      {eventEvolution.yearlyData.length} années • CA total: {totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={eventEvolution.yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                      />
                      <Bar dataKey="revenue" name="CA" fill="#9333ea" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
