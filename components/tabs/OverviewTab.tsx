'use client';

import { AggregatedEventData } from '@/types';
import { TrendingUp, Calendar, Users, Euro, ShoppingCart, Percent } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateYearlyEvolution } from '@/lib/dataProcessing';

interface OverviewTabProps {
  events: AggregatedEventData[];
}

export default function OverviewTab({ events }: OverviewTabProps) {
  // Calculer les métriques globales
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const totalBuyers = events.reduce((sum, e) => sum + e.buyers, 0);
  const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0);
  const avgOrder = totalBuyers > 0 ? totalRevenue / totalBuyers : 0;
  const avgBuyerRate = totalParticipants > 0 ? (totalBuyers / totalParticipants) * 100 : 0;

  // Top 10 événements par CA
  const topEvents = [...events]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Évolution annuelle
  const yearlyEvolution = calculateYearlyEvolution(events);

  // Événements récents (année actuelle et précédente)
  const currentYear = new Date().getFullYear();
  const recentEvents = events
    .filter(e => e.year >= currentYear - 1)
    .sort((a, b) => b.year - a.year)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h2>
        <p className="text-gray-600 mt-1">Statistiques globales et tendances</p>
      </div>

      {/* Cartes de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Chiffre d'affaires total"
          value={`${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          icon={<Euro className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Nombre d'événements"
          value={events.length.toLocaleString('fr-FR')}
          icon={<Calendar className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Total acheteurs"
          value={totalBuyers.toLocaleString('fr-FR')}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Panier moyen"
          value={`${avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
        />
        <MetricCard
          title="Taux d'achat moyen"
          value={`${avgBuyerRate.toFixed(2)} %`}
          icon={<Percent className="w-6 h-6" />}
          color="pink"
        />
        <MetricCard
          title="CA moyen par événement"
          value={`${(totalRevenue / events.length).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="indigo"
        />
      </div>

      {/* Graphique d'évolution annuelle */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du CA par année</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearlyEvolution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Chiffre d'affaires"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 événements */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 événements par CA</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topEvents}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="event"
              angle={-45}
              textAnchor="end"
              height={150}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
            />
            <Bar dataKey="revenue" name="CA" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Événements récents */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Événements récents</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événement</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acheteurs</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Panier moyen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEvents.map((event, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{event.event}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{event.year}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {event.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {event.buyers.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {event.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
